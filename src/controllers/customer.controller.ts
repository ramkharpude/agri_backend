import { Request, Response } from 'express';
import Customer from '../models/customer.model';
import User from '../models/user.model';
import { Op } from 'sequelize';

// ─── Create Customer ──────────────────────────────────────────────────────────
export const createCustomer = async (req: Request, res: Response) => {
    try {
        const { name, phoneNumber, address, gstNumber } = req.body;

        if (!name || !phoneNumber) {
            return res.status(400).json({ message: 'Name and phone number are required' });
        }

        // Check for duplicate phone
        const existing = await Customer.findOne({ where: { phoneNumber } });
        if (existing) {
            return res.status(409).json({ message: 'Customer with this phone number already exists', customer: existing });
        }

        // Auto-link to app user if exists
        let userId = null;
        const appUser = await User.findOne({ where: { phoneNumber } });
        if (appUser) userId = appUser.id;

        const customer = await Customer.create({
            name, phoneNumber, address: address || '', gstNumber, userId, outstandingAmount: 0
        });

        res.status(201).json(customer);
    } catch (error) {
        console.error('Create Customer Error:', error);
        res.status(500).json({ message: 'Error creating customer', error: (error as any).message });
    }
};

// ─── Get All Customers ────────────────────────────────────────────────────────
export const getAllCustomers = async (req: Request, res: Response) => {
    try {
        const { search } = req.query;

        let whereClause: any = {};
        if (search) {
            whereClause = {
                [Op.or]: [
                    { name: { [Op.iLike]: `%${search}%` } },
                    { phoneNumber: { [Op.iLike]: `%${search}%` } }
                ]
            };
        }

        const customers = await Customer.findAll({
            where: whereClause,
            order: [['name', 'ASC']]
        });

        res.status(200).json(customers);
    } catch (error) {
        console.error('Get Customers Error:', error);
        res.status(500).json({ message: 'Error fetching customers', error: (error as any).message });
    }
};

// ─── Get Customer By ID ───────────────────────────────────────────────────────
export const getCustomerById = async (req: Request, res: Response) => {
    try {
        const customer = await Customer.findByPk(req.params.id);
        if (!customer) return res.status(404).json({ message: 'Customer not found' });
        res.status(200).json(customer);
    } catch (error) {
        console.error('Get Customer Error:', error);
        res.status(500).json({ message: 'Error fetching customer', error: (error as any).message });
    }
};

// ─── Update Customer ──────────────────────────────────────────────────────────
export const updateCustomer = async (req: Request, res: Response) => {
    try {
        const customer = await Customer.findByPk(req.params.id);
        if (!customer) return res.status(404).json({ message: 'Customer not found' });

        const { name, phoneNumber, address, gstNumber } = req.body;
        if (name) customer.name = name;
        if (phoneNumber) customer.phoneNumber = phoneNumber;
        if (address !== undefined) customer.address = address;
        if (gstNumber !== undefined) customer.gstNumber = gstNumber;

        await customer.save();
        res.status(200).json(customer);
    } catch (error) {
        console.error('Update Customer Error:', error);
        res.status(500).json({ message: 'Error updating customer', error: (error as any).message });
    }
};

// ─── Search Customers (lightweight for billing UI) ────────────────────────────
export const searchCustomers = async (req: Request, res: Response) => {
    try {
        const { q } = req.query;
        if (!q) return res.status(200).json([]);

        const customers = await Customer.findAll({
            where: {
                [Op.or]: [
                    { name: { [Op.iLike]: `%${q}%` } },
                    { phoneNumber: { [Op.iLike]: `%${q}%` } }
                ]
            },
            limit: 10,
            attributes: ['id', 'name', 'phoneNumber', 'outstandingAmount'],
            order: [['name', 'ASC']]
        });

        res.status(200).json(customers);
    } catch (error) {
        console.error('Search Customers Error:', error);
        res.status(500).json({ message: 'Error searching customers', error: (error as any).message });
    }
};
