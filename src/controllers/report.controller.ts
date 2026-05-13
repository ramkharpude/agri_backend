import { Request, Response } from 'express';
import Invoice from '../models/invoice.model';
import InvoiceItem from '../models/invoiceItem.model';
import Customer from '../models/customer.model';
import Product from '../models/product.model';
import ErpPayment from '../models/erpPayment.model';
import { Op, fn, col, literal } from 'sequelize';
import sequelize from '../config/database';

// ─── Daily Sales Report ───────────────────────────────────────────────────────
export const getDailySales = async (req: Request, res: Response) => {
    try {
        const { date } = req.query;
        const d = date ? new Date(date as string) : new Date();
        const startOfDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());
        const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

        const invoices = await Invoice.findAll({
            where: { createdAt: { [Op.gte]: startOfDay, [Op.lt]: endOfDay } },
            include: [{ model: Customer, as: 'customer', attributes: ['name', 'phoneNumber'] }],
            order: [['createdAt', 'DESC']]
        });

        const totalSales = invoices.reduce((sum, inv) => sum + inv.netAmount, 0);
        const totalCollected = invoices.reduce((sum, inv) => sum + inv.paidAmount, 0);
        const totalUdhari = totalSales - totalCollected;
        const invoiceCount = invoices.length;

        // Payment mode breakdown
        const rokhSales = invoices.filter(i => i.paymentMode === 'rokh').reduce((s, i) => s + i.netAmount, 0);
        const upiSales = invoices.filter(i => i.paymentMode === 'upi').reduce((s, i) => s + i.netAmount, 0);
        const udhariSales = invoices.filter(i => i.paymentMode === 'udhari').reduce((s, i) => s + i.netAmount, 0);
        const partialSales = invoices.filter(i => i.paymentMode === 'partial').reduce((s, i) => s + i.netAmount, 0);

        // Collections today
        const collections = await ErpPayment.findAll({
            where: { createdAt: { [Op.gte]: startOfDay, [Op.lt]: endOfDay } }
        });
        const totalCollections = collections.reduce((sum, p) => sum + p.amount, 0);

        res.status(200).json({
            date: startOfDay.toISOString().split('T')[0],
            invoiceCount,
            totalSales,
            totalCollected,
            totalUdhari,
            totalCollections,
            breakdown: { rokh: rokhSales, upi: upiSales, udhari: udhariSales, partial: partialSales },
            invoices
        });
    } catch (error) {
        console.error('Daily Sales Error:', error);
        res.status(500).json({ message: 'Error fetching daily sales', error: (error as any).message });
    }
};

// ─── Weekly Sales Report ──────────────────────────────────────────────────────
export const getWeeklySales = async (req: Request, res: Response) => {
    try {
        const { date } = req.query; 
        const d = date ? new Date(date as string) : new Date();
        
        // Find start of week (Monday)
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1);
        const startOfWeek = new Date(d.getFullYear(), d.getMonth(), diff);
        const endOfWeek = new Date(startOfWeek.getTime() + 7 * 24 * 60 * 60 * 1000);

        const invoices = await Invoice.findAll({
            where: { createdAt: { [Op.gte]: startOfWeek, [Op.lt]: endOfWeek } },
            order: [['createdAt', 'DESC']]
        });

        const totalSales = invoices.reduce((sum, inv) => sum + inv.netAmount, 0);
        const totalCollected = invoices.reduce((sum, inv) => sum + inv.paidAmount, 0);
        const totalUdhari = totalSales - totalCollected;

        const dayWise: any = {};
        invoices.forEach(inv => {
            const dt = new Date(inv.createdAt);
            const yyyy = dt.getFullYear();
            const mm = String(dt.getMonth() + 1).padStart(2, '0');
            const dd = String(dt.getDate()).padStart(2, '0');
            const dayStr = `${yyyy}-${mm}-${dd}`;
            
            if (!dayWise[dayStr]) dayWise[dayStr] = { sales: 0, count: 0 };
            dayWise[dayStr].sales += inv.netAmount;
            dayWise[dayStr].count += 1;
        });

        const collections = await ErpPayment.findAll({
            where: { createdAt: { [Op.gte]: startOfWeek, [Op.lt]: endOfWeek } }
        });
        const totalCollections = collections.reduce((sum, p) => sum + p.amount, 0);

        res.status(200).json({
            startDate: startOfWeek.toISOString().split('T')[0],
            endDate: new Date(endOfWeek.getTime() - 1).toISOString().split('T')[0],
            invoiceCount: invoices.length,
            totalSales,
            totalCollected,
            totalUdhari,
            totalCollections,
            dayWise
        });
    } catch (error) {
        console.error('Weekly Sales Error:', error);
        res.status(500).json({ message: 'Error fetching weekly sales', error: (error as any).message });
    }
};

// ─── Monthly Sales Report ─────────────────────────────────────────────────────
export const getMonthlySales = async (req: Request, res: Response) => {
    try {
        const { month, year } = req.query;
        const m = month ? Number(month) - 1 : new Date().getMonth();
        const y = year ? Number(year) : new Date().getFullYear();

        const startOfMonth = new Date(y, m, 1);
        const endOfMonth = new Date(y, m + 1, 1);

        const invoices = await Invoice.findAll({
            where: { createdAt: { [Op.gte]: startOfMonth, [Op.lt]: endOfMonth } },
            order: [['createdAt', 'DESC']]
        });

        const totalSales = invoices.reduce((sum, inv) => sum + inv.netAmount, 0);
        const totalCollected = invoices.reduce((sum, inv) => sum + inv.paidAmount, 0);
        const totalUdhari = totalSales - totalCollected;

        // Day-wise breakdown
        const dayWise: any = {};
        invoices.forEach(inv => {
            const dt = new Date(inv.createdAt);
            const yyyy = dt.getFullYear();
            const mm = String(dt.getMonth() + 1).padStart(2, '0');
            const dd = String(dt.getDate()).padStart(2, '0');
            const dayStr = `${yyyy}-${mm}-${dd}`;

            if (!dayWise[dayStr]) dayWise[dayStr] = { sales: 0, count: 0 };
            dayWise[dayStr].sales += inv.netAmount;
            dayWise[dayStr].count += 1;
        });

        // Collections this month
        const collections = await ErpPayment.findAll({
            where: { createdAt: { [Op.gte]: startOfMonth, [Op.lt]: endOfMonth } }
        });
        const totalCollections = collections.reduce((sum, p) => sum + p.amount, 0);

        res.status(200).json({
            month: m + 1,
            year: y,
            invoiceCount: invoices.length,
            totalSales,
            totalCollected,
            totalUdhari,
            totalCollections,
            dayWise
        });
    } catch (error) {
        console.error('Monthly Sales Error:', error);
        res.status(500).json({ message: 'Error fetching monthly sales', error: (error as any).message });
    }
};

// ─── Product-wise Sales ───────────────────────────────────────────────────────
export const getProductWiseSales = async (req: Request, res: Response) => {
    try {
        const results = await InvoiceItem.findAll({
            attributes: [
                'productId',
                'productName',
                [fn('SUM', col('quantity')), 'totalQty'],
                [fn('SUM', col('amount')), 'totalRevenue'],
                [fn('COUNT', col('invoiceId')), 'invoiceCount']
            ],
            group: ['productId', 'productName'],
            order: [[literal('"totalRevenue"'), 'DESC']],
            limit: 50
        });

        res.status(200).json(results);
    } catch (error) {
        console.error('Product Sales Error:', error);
        res.status(500).json({ message: 'Error fetching product sales', error: (error as any).message });
    }
};

// ─── Customer-wise Sales ──────────────────────────────────────────────────────
export const getCustomerWiseSales = async (req: Request, res: Response) => {
    try {
        const results = await Invoice.findAll({
            attributes: [
                'customerId',
                [fn('COUNT', col('Invoice.id')), 'invoiceCount'],
                [fn('SUM', col('netAmount')), 'totalPurchases'],
                [fn('SUM', col('paidAmount')), 'totalPaid']
            ],
            include: [{ model: Customer, as: 'customer', attributes: ['name', 'phoneNumber', 'outstandingAmount'] }],
            group: ['customerId', 'customer.id', 'customer.name', 'customer.phoneNumber', 'customer.outstandingAmount'],
            order: [[literal('"totalPurchases"'), 'DESC']],
            limit: 50
        });

        res.status(200).json(results);
    } catch (error) {
        console.error('Customer Sales Error:', error);
        res.status(500).json({ message: 'Error fetching customer sales', error: (error as any).message });
    }
};

// ─── Pending Udhari Report ────────────────────────────────────────────────────
export const getPendingUdhari = async (req: Request, res: Response) => {
    try {
        const customers = await Customer.findAll({
            where: { outstandingAmount: { [Op.gt]: 0 } },
            order: [['outstandingAmount', 'DESC']],
            attributes: ['id', 'name', 'phoneNumber', 'outstandingAmount']
        });

        const totalPending = customers.reduce((sum, c) => sum + c.outstandingAmount, 0);

        res.status(200).json({ totalPending, customerCount: customers.length, customers });
    } catch (error) {
        console.error('Pending Udhari Error:', error);
        res.status(500).json({ message: 'Error fetching pending udhari', error: (error as any).message });
    }
};

// ─── Stock Valuation Report ───────────────────────────────────────────────────
export const getStockValuation = async (req: Request, res: Response) => {
    try {
        const products = await Product.findAll({
            where: { stock: { [Op.gt]: 0 } },
            attributes: ['id', 'name', 'category', 'stock', 'price', 'purchasePrice', 'unit'],
            order: [['category', 'ASC'], ['name', 'ASC']]
        });

        let totalRetailValue = 0;
        let totalCostValue = 0;

        const items = products.map(p => {
            const retailVal = p.stock * p.price;
            const costVal = p.stock * (p.purchasePrice || p.price);
            totalRetailValue += retailVal;
            totalCostValue += costVal;
            return {
                ...p.toJSON(),
                retailValue: retailVal,
                costValue: costVal
            };
        });

        res.status(200).json({ totalRetailValue, totalCostValue, items });
    } catch (error) {
        console.error('Stock Valuation Error:', error);
        res.status(500).json({ message: 'Error fetching stock valuation', error: (error as any).message });
    }
};

// ─── ERP Dashboard Stats ─────────────────────────────────────────────────────
export const getErpDashboardStats = async (req: Request, res: Response) => {
    try {
        const today = new Date();
        const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

        // Today's sales
        const todayInvoices = await Invoice.findAll({
            where: { createdAt: { [Op.gte]: startOfDay, [Op.lt]: endOfDay } }
        });
        const todaySales = todayInvoices.reduce((s, i) => s + i.netAmount, 0);
        const todayCollection = todayInvoices.reduce((s, i) => s + i.paidAmount, 0);

        // Monthly sales
        const monthInvoices = await Invoice.findAll({
            where: { createdAt: { [Op.gte]: startOfMonth, [Op.lt]: endOfDay } }
        });
        const monthlySales = monthInvoices.reduce((s, i) => s + i.netAmount, 0);

        // Total outstanding
        const totalOutstanding = await Customer.sum('outstandingAmount') || 0;

        // Low stock count
        const lowStockCount = await Product.count({
            where: sequelize.literal('"stock" <= "lowStockThreshold"')
        });

        // Today's collections (separate payments)
        const todayPayments = await ErpPayment.findAll({
            where: { createdAt: { [Op.gte]: startOfDay, [Op.lt]: endOfDay } }
        });
        const todayCollections = todayPayments.reduce((s, p) => s + p.amount, 0);

        // Top selling products (this month)
        const topProducts = await InvoiceItem.findAll({
            attributes: [
                'productName',
                [fn('SUM', col('quantity')), 'totalQty'],
                [fn('SUM', col('amount')), 'totalRevenue']
            ],
            include: [{
                model: Invoice,
                attributes: [],
                where: { createdAt: { [Op.gte]: startOfMonth } }
            }],
            group: ['productName'],
            order: [[literal('"totalRevenue"'), 'DESC']],
            limit: 5
        });

        res.status(200).json({
            todaySales,
            todayCollection,
            todayCollections,
            todayInvoiceCount: todayInvoices.length,
            monthlySales,
            monthlyInvoiceCount: monthInvoices.length,
            totalOutstanding,
            lowStockCount,
            topProducts
        });
    } catch (error) {
        console.error('ERP Dashboard Error:', error);
        res.status(500).json({ message: 'Error fetching dashboard stats', error: (error as any).message });
    }
};
