import { Request, Response } from 'express';
import LedgerEntry from '../models/ledgerEntry.model';
import Customer from '../models/customer.model';
import Invoice from '../models/invoice.model';
import { Op } from 'sequelize';

// ─── Get Customer Ledger ──────────────────────────────────────────────────────
export const getCustomerLedger = async (req: Request, res: Response) => {
    try {
        const { customerId } = req.params;

        const customer = await Customer.findByPk(customerId);
        if (!customer) return res.status(404).json({ message: 'Customer not found' });

        const entries = await LedgerEntry.findAll({
            where: { customerId },
            include: [{ model: Invoice, as: 'invoice', attributes: ['invoiceNumber', 'netAmount', 'status'] }],
            order: [['createdAt', 'DESC'], ['id', 'DESC']]
        });

        res.status(200).json({
            customer: {
                id: customer.id,
                name: customer.name,
                phoneNumber: customer.phoneNumber,
                outstandingAmount: customer.outstandingAmount
            },
            entries
        });
    } catch (error) {
        console.error('Get Customer Ledger Error:', error);
        res.status(500).json({ message: 'Error fetching ledger', error: (error as any).message });
    }
};

// ─── Get Outstanding Summary (all customers with pending) ─────────────────────
export const getOutstandingSummary = async (req: Request, res: Response) => {
    try {
        const customers = await Customer.findAll({
            where: { outstandingAmount: { [Op.gt]: 0 } },
            order: [['outstandingAmount', 'DESC']],
            attributes: ['id', 'name', 'phoneNumber', 'outstandingAmount']
        });

        const totalOutstanding = customers.reduce((sum, c) => sum + c.outstandingAmount, 0);

        res.status(200).json({ customers, totalOutstanding });
    } catch (error) {
        console.error('Get Outstanding Summary Error:', error);
        res.status(500).json({ message: 'Error fetching outstanding', error: (error as any).message });
    }
};

// ─── User App: Get My Udhari ──────────────────────────────────────────────────
export const getUserUdhari = async (req: any, res: Response) => {
    try {
        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ message: 'Not authenticated' });

        const customer = await Customer.findOne({ where: { userId } });
        if (!customer) return res.status(200).json({ outstandingAmount: 0, entries: [] });

        const entries = await LedgerEntry.findAll({
            where: { customerId: customer.id },
            include: [{ model: Invoice, as: 'invoice', attributes: ['invoiceNumber', 'netAmount'] }],
            order: [['createdAt', 'DESC'], ['id', 'DESC']]
        });

        res.status(200).json({
            outstandingAmount: customer.outstandingAmount,
            entries
        });
    } catch (error) {
        console.error('Get User Udhari Error:', error);
        res.status(500).json({ message: 'Error fetching udhari', error: (error as any).message });
    }
};
