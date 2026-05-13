import { Request, Response } from 'express';
import sequelize from '../config/database';
import Product from '../models/product.model';
import Customer from '../models/customer.model';
import Invoice from '../models/invoice.model';
import InvoiceItem from '../models/invoiceItem.model';
import LedgerEntry from '../models/ledgerEntry.model';
import StockMovement from '../models/stockMovement.model';
import { AuthRequest } from '../middleware/auth.middleware';
import { sendPushNotification } from '../services/notification.service';
import Notification from '../models/notification.model';
import User from '../models/user.model';

// ─── Generate Invoice Number ──────────────────────────────────────────────────
const generateInvoiceNumber = async (): Promise<string> => {
    const today = new Date();
    const dateStr = today.getFullYear().toString() +
        String(today.getMonth() + 1).padStart(2, '0') +
        String(today.getDate()).padStart(2, '0');

    // Count today's invoices to get sequence
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

    const count = await Invoice.count({
        where: {
            createdAt: {
                [require('sequelize').Op.gte]: startOfDay,
                [require('sequelize').Op.lt]: endOfDay
            }
        }
    });

    const seq = String(count + 1).padStart(4, '0');
    return `INV-${dateStr}-${seq}`;
};

// ─── Create Invoice (ATOMIC BILLING) ──────────────────────────────────────────
export const createInvoice = async (req: AuthRequest, res: Response) => {
    const transaction = await sequelize.transaction();

    try {
        const { customerId, items, discountAmount, paymentMode, paidAmount, notes } = req.body;

        if (!customerId || !items || items.length === 0) {
            await transaction.rollback();
            return res.status(400).json({ message: 'Customer and items are required' });
        }

        // 1. Validate customer
        const customer = await Customer.findByPk(customerId, { transaction });
        if (!customer) {
            await transaction.rollback();
            return res.status(404).json({ message: 'Customer not found' });
        }

        // 2. Validate stock and prepare items
        let totalAmount = 0;
        const invoiceItems: any[] = [];
        const stockUpdates: any[] = [];

        for (const item of items) {
            const product = await Product.findByPk(item.productId, { transaction, lock: true });
            if (!product) {
                await transaction.rollback();
                return res.status(404).json({ message: `Product not found: ID ${item.productId}` });
            }

            if (product.stock < item.quantity) {
                await transaction.rollback();
                return res.status(400).json({
                    message: `Insufficient stock for "${product.name}". Available: ${product.stock}, Requested: ${item.quantity}`
                });
            }

            const rate = item.rate !== undefined ? Number(item.rate) : (product.offerPrice || product.price);
            const amount = rate * item.quantity;
            totalAmount += amount;

            invoiceItems.push({
                productId: product.id,
                productName: product.name,
                quantity: item.quantity,
                unit: product.unit || 'piece',
                rate,
                amount
            });

            stockUpdates.push({
                product,
                quantity: item.quantity,
                previousStock: product.stock
            });
        }

        // 3. Calculate net amount
        const discount = discountAmount || 0;
        const netAmount = totalAmount - discount;

        // 4. Determine payment status
        let paid = 0;
        let status = 'unpaid';

        if (paymentMode === 'rokh' || paymentMode === 'upi' || paymentMode === 'bank_transfer') {
            paid = netAmount;
            status = 'paid';
        } else if (paymentMode === 'partial') {
            paid = paidAmount || 0;
            status = paid >= netAmount ? 'paid' : 'partial';
        } else if (paymentMode === 'udhari') {
            paid = 0;
            status = 'unpaid';
        }

        // 5. Generate invoice number
        const invoiceNumber = await generateInvoiceNumber();

        // 6. Create invoice
        const invoice = await Invoice.create({
            invoiceNumber,
            customerId,
            totalAmount,
            discountAmount: discount,
            netAmount,
            paidAmount: paid,
            paymentMode,
            status,
            notes: notes || null,
            billedBy: req.user?.fullName || 'Admin'
        }, { transaction });

        // 7. Create invoice items
        for (const item of invoiceItems) {
            await InvoiceItem.create({
                invoiceId: invoice.id,
                ...item
            }, { transaction });
        }

        // 8. Reduce stock and create stock movements
        for (const update of stockUpdates) {
            const newStock = update.product.stock - update.quantity;
            await update.product.update({ stock: newStock }, { transaction });

            await StockMovement.create({
                productId: update.product.id,
                type: 'sale',
                quantity: -update.quantity,
                previousStock: update.previousStock,
                newStock,
                referenceId: invoiceNumber,
                notes: `Sold via invoice ${invoiceNumber}`
            }, { transaction });
        }

        // 9. Create ledger entry (for udhari/partial tracking)
        const unpaidAmount = netAmount - paid;

        if (unpaidAmount > 0) {
            // Calculate new running balance
            const lastEntry = await LedgerEntry.findOne({
                where: { customerId },
                order: [['createdAt', 'DESC'], ['id', 'DESC']],
                transaction
            });
            const prevBalance = lastEntry ? lastEntry.balance : 0;
            const newBalance = prevBalance + unpaidAmount;

            await LedgerEntry.create({
                customerId,
                invoiceId: invoice.id,
                type: 'sale',
                debit: unpaidAmount,
                credit: 0,
                balance: newBalance,
                description: `Invoice ${invoiceNumber} — ₹${netAmount} bill, ₹${paid} paid, ₹${unpaidAmount} udhari`
            }, { transaction });

            // Update customer outstanding
            await customer.update({
                outstandingAmount: newBalance
            }, { transaction });
        }

        // 10. Commit transaction
        await transaction.commit();

        // 11. Send notification to customer (if linked to app user)
        if (customer.userId) {
            try {
                const user = await User.findByPk(customer.userId);
                if (user && user.pushToken) {
                    await sendPushNotification(
                        user.pushToken,
                        '🧾 New Invoice',
                        `Invoice ${invoiceNumber} for ₹${netAmount} has been generated.`
                    );
                }
                await Notification.create({
                    userId: customer.userId,
                    title: '🧾 New Invoice',
                    message: `Invoice ${invoiceNumber} for ₹${netAmount}. ${status === 'paid' ? 'Paid ✅' : `Outstanding: ₹${unpaidAmount}`}`,
                    type: 'invoice',
                    relatedId: invoice.id.toString(),
                    isRead: false
                });
            } catch (notifError) {
                console.error('Notification Error (non-critical):', notifError);
            }
        }

        // 12. Return full invoice
        const fullInvoice = await Invoice.findByPk(invoice.id, {
            include: [
                { model: InvoiceItem, as: 'items' },
                { model: Customer, as: 'customer' }
            ]
        });

        res.status(201).json(fullInvoice);
    } catch (error) {
        await transaction.rollback();
        console.error('Create Invoice Error:', error);
        res.status(500).json({ message: 'Error creating invoice', error: (error as any).message });
    }
};

// ─── Get Invoice by ID ────────────────────────────────────────────────────────
export const getInvoiceById = async (req: Request, res: Response) => {
    try {
        const invoice = await Invoice.findByPk(req.params.id, {
            include: [
                { model: InvoiceItem, as: 'items' },
                { model: Customer, as: 'customer' }
            ]
        });
        if (!invoice) return res.status(404).json({ message: 'Invoice not found' });
        res.status(200).json(invoice);
    } catch (error) {
        console.error('Get Invoice Error:', error);
        res.status(500).json({ message: 'Error fetching invoice', error: (error as any).message });
    }
};

// ─── Get All Invoices (with filters) ──────────────────────────────────────────
export const getAllInvoices = async (req: Request, res: Response) => {
    try {
        const { status, paymentMode, date, page = 1, limit = 50 } = req.query;

        let whereClause: any = {};
        if (status) whereClause.status = status;
        if (paymentMode) whereClause.paymentMode = paymentMode;
        if (date) {
            const d = new Date(date as string);
            const startOfDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());
            const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);
            whereClause.createdAt = {
                [require('sequelize').Op.gte]: startOfDay,
                [require('sequelize').Op.lt]: endOfDay
            };
        }

        const offset = (Number(page) - 1) * Number(limit);
        const { rows, count } = await Invoice.findAndCountAll({
            where: whereClause,
            include: [{ model: Customer, as: 'customer', attributes: ['id', 'name', 'phoneNumber'] }],
            order: [['createdAt', 'DESC']],
            limit: Number(limit),
            offset
        });

        res.status(200).json({ invoices: rows, total: count, page: Number(page), totalPages: Math.ceil(count / Number(limit)) });
    } catch (error) {
        console.error('Get All Invoices Error:', error);
        res.status(500).json({ message: 'Error fetching invoices', error: (error as any).message });
    }
};

// ─── Get Invoices by Customer ─────────────────────────────────────────────────
export const getInvoicesByCustomer = async (req: Request, res: Response) => {
    try {
        const invoices = await Invoice.findAll({
            where: { customerId: req.params.customerId },
            include: [{ model: InvoiceItem, as: 'items' }],
            order: [['createdAt', 'DESC']]
        });
        res.status(200).json(invoices);
    } catch (error) {
        console.error('Get Customer Invoices Error:', error);
        res.status(500).json({ message: 'Error fetching invoices', error: (error as any).message });
    }
};

// ─── User App: Get My Invoices (by linked userId) ─────────────────────────────
export const getUserInvoices = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ message: 'Not authenticated' });

        // Find customer linked to this user
        const customer = await Customer.findOne({ where: { userId } });
        if (!customer) return res.status(200).json([]);

        const invoices = await Invoice.findAll({
            where: { customerId: customer.id },
            include: [{ model: InvoiceItem, as: 'items' }],
            order: [['createdAt', 'DESC']]
        });

        res.status(200).json(invoices);
    } catch (error) {
        console.error('Get User Invoices Error:', error);
        res.status(500).json({ message: 'Error fetching invoices', error: (error as any).message });
    }
};

// ─── Cancel Invoice ───────────────────────────────────────────────────────────
export const cancelInvoice = async (req: AuthRequest, res: Response) => {
    const transaction = await sequelize.transaction();
    try {
        const invoiceId = req.params.id;
        const invoice = await Invoice.findByPk(invoiceId, {
            transaction,
            lock: true
        });

        if (!invoice) {
            await transaction.rollback();
            return res.status(404).json({ message: 'Invoice not found' });
        }

        if (invoice.status === 'cancelled') {
            await transaction.rollback();
            return res.status(400).json({ message: 'Invoice is already cancelled' });
        }

        // Fetch items separately to avoid Postgres outer join lock issue
        const invoiceItems = await InvoiceItem.findAll({
            where: { invoiceId: invoice.id },
            transaction
        });

        // 1. Restore Stock
        if (invoiceItems && invoiceItems.length > 0) {
            for (const item of invoiceItems) {
                const product = await Product.findByPk(item.productId, { transaction, lock: true });
                if (product) {
                    const newStock = product.stock + item.quantity;
                    await product.update({ stock: newStock }, { transaction });

                    // Log Reversal Movement
                    await StockMovement.create({
                        productId: product.id,
                        type: 'adjustment', // Or 'restock'
                        quantity: item.quantity,
                        previousStock: product.stock,
                        newStock: newStock,
                        referenceId: invoice.invoiceNumber,
                        notes: `Restock due to Invoice Cancellation: ${invoice.invoiceNumber}`
                    }, { transaction });
                }
            }
        }

        // 2. Reverse Ledger / Udhari
        const unpaidAmount = invoice.netAmount - invoice.paidAmount;
        if (unpaidAmount > 0) {
            const customer = await Customer.findByPk(invoice.customerId, { transaction, lock: true });
            if (customer) {
                const newBalance = customer.outstandingAmount - unpaidAmount;
                
                await LedgerEntry.create({
                    customerId: customer.id,
                    invoiceId: invoice.id,
                    type: 'payment', // Treat reversal as a credit/payment to balance the ledger
                    debit: 0,
                    credit: unpaidAmount,
                    balance: newBalance,
                    description: `Reversal for Cancelled Invoice ${invoice.invoiceNumber}`
                }, { transaction });

                await customer.update({ outstandingAmount: newBalance }, { transaction });
            }
        }

        // 3. Mark Invoice as Cancelled
        await invoice.update({ status: 'cancelled' }, { transaction });

        await transaction.commit();
        res.status(200).json({ message: 'Invoice successfully cancelled and stock restored.', invoice });
    } catch (error) {
        await transaction.rollback();
        console.error('Cancel Invoice Error:', error);
        res.status(500).json({ message: 'Error cancelling invoice', error: (error as any).message });
    }
};

// ─── Online Draft Bills (User App Integration) ──────────────────────────────

export const createOnlineOrder = async (req: AuthRequest, res: Response) => {
    const transaction = await sequelize.transaction();
    try {
        const { items, shippingAddress, totalAmount, paymentMethod } = req.body;
        const userId = req.user?.id;

        if (!userId || !items || items.length === 0) {
            await transaction.rollback();
            return res.status(400).json({ message: 'User and items are required' });
        }

        // 1. Find or create Customer profile
        let customer = await Customer.findOne({ where: { userId }, transaction });
        if (!customer) {
            const user = await User.findByPk(userId, { transaction });
            if (!user) {
                await transaction.rollback();
                return res.status(404).json({ message: 'User not found' });
            }
            customer = await Customer.create({
                name: user.fullName,
                phoneNumber: user.phoneNumber,
                address: user.address || '',
                userId: user.id,
                outstandingAmount: 0
            }, { transaction });
        }

        // 2. Generate Invoice Number
        const invoiceNumber = await generateInvoiceNumber();

        // 3. Format shipping info as notes
        const addressText = shippingAddress 
            ? `[ONLINE ORDER]\nShip to: ${shippingAddress.fullName}\n${shippingAddress.addressLine}, ${shippingAddress.city}, ${shippingAddress.zipCode}\nPhone: ${shippingAddress.phoneNumber}`
            : '[ONLINE ORDER] Pickup/Direct';

        // 4. Create Draft Invoice (online_pending)
        const invoice = await Invoice.create({
            invoiceNumber,
            customerId: customer.id,
            totalAmount: totalAmount,
            discountAmount: 0,
            netAmount: totalAmount,
            paidAmount: paymentMethod === 'UPI' ? totalAmount : 0,
            paymentMode: paymentMethod || 'upi',
            status: 'online_pending',
            notes: addressText,
            billedBy: 'User App'
        }, { transaction });

        // 5. Add Items
        for (const item of items) {
            // Note: In cart, item is { id, name, price, offerPrice, quantity, ... }
            const rate = item.offerPrice || item.price;
            await InvoiceItem.create({
                invoiceId: invoice.id,
                productId: item.id || item.productId,
                productName: item.name || item.productName,
                quantity: item.quantity,
                unit: item.unit || 'piece',
                rate: rate,
                amount: rate * item.quantity
            }, { transaction });
        }

        await transaction.commit();

        // Notify Admin (non-critical, don't crash if this fails)
        try {
            await Notification.create({
                userId: 0, // Admin
                title: 'New Online Order',
                message: `A new order (${invoiceNumber}) has been placed by ${customer.name}.`,
                type: 'online_order',
                relatedId: invoice.id.toString(),
                isRead: false
            });
        } catch (notifError) {
            console.error('Admin notification failed (non-critical):', notifError);
        }

        res.status(201).json({ message: 'Order placed successfully', invoice });
    } catch (error) {
        try { await transaction.rollback(); } catch (_) {}
        console.error('Create Online Order Error:', error);
        res.status(500).json({ message: 'Error placing order', error: (error as any).message });
    }
};

export const getPendingOnlineOrders = async (req: Request, res: Response) => {
    try {
        const invoices = await Invoice.findAll({
            where: { status: 'online_pending' },
            include: [
                { model: Customer, as: 'customer', attributes: ['id', 'name', 'phoneNumber'] },
                { model: InvoiceItem, as: 'items' }
            ],
            order: [['createdAt', 'DESC']]
        });
        res.status(200).json(invoices);
    } catch (error) {
        console.error('Get Pending Orders Error:', error);
        res.status(500).json({ message: 'Error fetching pending orders', error: (error as any).message });
    }
};

export const approveOnlineOrder = async (req: AuthRequest, res: Response) => {
    const transaction = await sequelize.transaction();
    try {
        const { id } = req.params;
        const invoice = await Invoice.findByPk(id, {
            include: [{ model: InvoiceItem, as: 'items' }, { model: Customer, as: 'customer' }],
            transaction
        });

        if (!invoice) {
            await transaction.rollback();
            return res.status(404).json({ message: 'Invoice not found' });
        }
        if (invoice.status !== 'online_pending') {
            await transaction.rollback();
            return res.status(400).json({ message: 'Invoice is not pending approval' });
        }

        const invoiceItems = (invoice as any).items;
        const customer = (invoice as any).customer;

        // 1. Deduct Stock & Create Stock Movement
        for (const item of invoiceItems) {
            const product = await Product.findByPk(item.productId, { transaction, lock: true });
            if (!product) {
                await transaction.rollback();
                return res.status(404).json({ message: `Product not found: ${item.productName}` });
            }
            if (product.stock < item.quantity) {
                await transaction.rollback();
                return res.status(400).json({ message: `Insufficient stock for "${product.name}". Available: ${product.stock}` });
            }

            const newStock = product.stock - item.quantity;
            await product.update({ stock: newStock }, { transaction });

            await StockMovement.create({
                productId: product.id,
                type: 'sale',
                quantity: -item.quantity,
                previousStock: product.stock,
                newStock,
                referenceType: 'invoice',
                referenceId: invoice.id,
                notes: `Online Order Approved: ${invoice.invoiceNumber}`
            }, { transaction });
        }

        // 2. Ledger Update
        let finalStatus = 'paid';
        if (invoice.paymentMode === 'udhari') {
            finalStatus = 'unpaid';
            const previousBalance = customer.outstandingAmount;
            const newBalance = previousBalance + invoice.netAmount;
            
            await customer.update({ outstandingAmount: newBalance }, { transaction });

            await LedgerEntry.create({
                customerId: customer.id,
                type: 'debit',
                amount: invoice.netAmount,
                balance: newBalance,
                description: `Online Bill: ${invoice.invoiceNumber}`,
                invoiceId: invoice.id
            }, { transaction });
        }

        // 3. Update Invoice Status
        await invoice.update({ status: finalStatus, billedBy: req.user?.fullName || 'Admin' }, { transaction });

        await transaction.commit();

        // Re-fetch the updated invoice with items for the response
        const updatedInvoice = await Invoice.findByPk(id, {
            include: [
                { model: InvoiceItem, as: 'items' },
                { model: Customer, as: 'customer' }
            ]
        });

        // Notify user (non-critical)
        try {
            if (customer.userId) {
                const user = await User.findByPk(customer.userId);
                if (user && user.pushToken) {
                    sendPushNotification(user.pushToken, 'Order Approved', `Your order ${invoice.invoiceNumber} has been approved and billed.`);
                }
            }
        } catch (notifError) {
            console.error('Push notification failed (non-critical):', notifError);
        }

        res.status(200).json({ message: 'Order approved successfully', invoice: updatedInvoice });
    } catch (error) {
        try { await transaction.rollback(); } catch (_) {}
        console.error('Approve Online Order Error:', error);
        res.status(500).json({ message: 'Error approving order', error: (error as any).message });
    }
};
