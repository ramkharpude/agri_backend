import { Request, Response } from 'express';
import sequelize from '../config/database';
import ErpPayment from '../models/erpPayment.model';
import Customer from '../models/customer.model';
import LedgerEntry from '../models/ledgerEntry.model';
import Invoice from '../models/invoice.model';
import { AuthRequest } from '../middleware/auth.middleware';
import { sendPushNotification } from '../services/notification.service';
import Notification from '../models/notification.model';
import User from '../models/user.model';

// ─── Generate Receipt Number ──────────────────────────────────────────────────
const generateReceiptNumber = async (): Promise<string> => {
    const today = new Date();
    const dateStr = today.getFullYear().toString() +
        String(today.getMonth() + 1).padStart(2, '0') +
        String(today.getDate()).padStart(2, '0');

    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

    const count = await ErpPayment.count({
        where: {
            createdAt: {
                [require('sequelize').Op.gte]: startOfDay,
                [require('sequelize').Op.lt]: endOfDay
            }
        }
    });

    const seq = String(count + 1).padStart(4, '0');
    return `RCP-${dateStr}-${seq}`;
};

// ─── Collect Payment (ATOMIC) ─────────────────────────────────────────────────
export const collectPayment = async (req: AuthRequest, res: Response) => {
    const transaction = await sequelize.transaction();

    try {
        const { customerId, amount, paymentMode, invoiceId, notes } = req.body;

        if (!customerId || !amount || amount <= 0) {
            await transaction.rollback();
            return res.status(400).json({ message: 'Customer ID and valid amount are required' });
        }

        // 1. Validate customer
        const customer = await Customer.findByPk(customerId, { transaction });
        if (!customer) {
            await transaction.rollback();
            return res.status(404).json({ message: 'Customer not found' });
        }

        // 2. Generate receipt number
        const receiptNumber = await generateReceiptNumber();

        // 3. Create payment record
        const payment = await ErpPayment.create({
            customerId,
            invoiceId: invoiceId || null,
            amount,
            paymentMode: paymentMode || 'cash',
            receiptNumber,
            notes: notes || null,
            collectedBy: req.user?.fullName || 'Admin'
        }, { transaction });

        // 4. Create ledger credit entry
        const lastEntry = await LedgerEntry.findOne({
            where: { customerId },
            order: [['createdAt', 'DESC'], ['id', 'DESC']],
            transaction
        });
        const prevBalance = lastEntry ? lastEntry.balance : 0;
        const newBalance = prevBalance - amount;

        await LedgerEntry.create({
            customerId,
            invoiceId: invoiceId || null,
            type: 'payment',
            debit: 0,
            credit: amount,
            balance: newBalance,
            description: `Payment received — ₹${amount} via ${paymentMode || 'cash'} (Receipt: ${receiptNumber})`
        }, { transaction });

        // 5. Update customer outstanding
        await customer.update({
            outstandingAmount: Math.max(0, newBalance)
        }, { transaction });

        // 6. If payment against specific invoice, update invoice status
        if (invoiceId) {
            const invoice = await Invoice.findByPk(invoiceId, { transaction });
            if (invoice) {
                const newPaidAmount = invoice.paidAmount + amount;
                let newStatus = invoice.status;
                if (newPaidAmount >= invoice.netAmount) {
                    newStatus = 'paid';
                } else if (newPaidAmount > 0) {
                    newStatus = 'partial';
                }
                // Note: We update paidAmount on the invoice for tracking even though
                // invoices are "immutable" — this only tracks cumulative payments, not bill changes
                await invoice.update({ paidAmount: newPaidAmount, status: newStatus }, { transaction });
            }
        }

        // 7. Commit
        await transaction.commit();

        // 8. Notify customer
        if (customer.userId) {
            try {
                const user = await User.findByPk(customer.userId);
                if (user && user.pushToken) {
                    await sendPushNotification(
                        user.pushToken,
                        '💰 Payment Received',
                        `₹${amount} payment recorded. Remaining: ₹${Math.max(0, newBalance)}`
                    );
                }
                await Notification.create({
                    userId: customer.userId,
                    title: '💰 Payment Received',
                    message: `₹${amount} payment recorded (${receiptNumber}). Remaining balance: ₹${Math.max(0, newBalance)}`,
                    type: 'payment',
                    relatedId: payment.id.toString(),
                    isRead: false
                });
            } catch (notifError) {
                console.error('Notification Error (non-critical):', notifError);
            }
        }

        res.status(201).json({
            payment,
            newOutstanding: Math.max(0, newBalance)
        });
    } catch (error) {
        await transaction.rollback();
        console.error('Collect Payment Error:', error);
        res.status(500).json({ message: 'Error collecting payment', error: (error as any).message });
    }
};

// ─── Get Payment History by Customer ──────────────────────────────────────────
export const getPaymentsByCustomer = async (req: Request, res: Response) => {
    try {
        const payments = await ErpPayment.findAll({
            where: { customerId: req.params.customerId },
            order: [['createdAt', 'DESC']]
        });
        res.status(200).json(payments);
    } catch (error) {
        console.error('Get Payments Error:', error);
        res.status(500).json({ message: 'Error fetching payments', error: (error as any).message });
    }
};

// ─── Get Payment Receipt ──────────────────────────────────────────────────────
export const getPaymentReceipt = async (req: Request, res: Response) => {
    try {
        const payment = await ErpPayment.findByPk(req.params.id, {
            include: [{ model: Customer, as: 'customer' }]
        });
        if (!payment) return res.status(404).json({ message: 'Payment not found' });
        res.status(200).json(payment);
    } catch (error) {
        console.error('Get Receipt Error:', error);
        res.status(500).json({ message: 'Error fetching receipt', error: (error as any).message });
    }
};

// ─── User App: Get My Payments ────────────────────────────────────────────────
export const getUserPayments = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ message: 'Not authenticated' });

        const customer = await Customer.findOne({ where: { userId } });
        if (!customer) return res.status(200).json([]);

        const payments = await ErpPayment.findAll({
            where: { customerId: customer.id },
            order: [['createdAt', 'DESC']]
        });

        res.status(200).json(payments);
    } catch (error) {
        console.error('Get User Payments Error:', error);
        res.status(500).json({ message: 'Error fetching payments', error: (error as any).message });
    }
};
