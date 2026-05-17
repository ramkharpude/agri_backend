"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.searchCustomers = exports.updateCustomer = exports.getCustomerById = exports.getAllCustomers = exports.createCustomer = void 0;
const customer_model_1 = __importDefault(require("../models/customer.model"));
const user_model_1 = __importDefault(require("../models/user.model"));
const sequelize_1 = require("sequelize");
// ─── Create Customer ──────────────────────────────────────────────────────────
const createCustomer = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { name, phoneNumber, address, gstNumber } = req.body;
        if (!name || !phoneNumber) {
            return res.status(400).json({ message: 'Name and phone number are required' });
        }
        // Check for duplicate phone
        const existing = yield customer_model_1.default.findOne({ where: { phoneNumber } });
        if (existing) {
            return res.status(409).json({ message: 'Customer with this phone number already exists', customer: existing });
        }
        // Auto-link to app user if exists
        let userId = null;
        const appUser = yield user_model_1.default.findOne({ where: { phoneNumber } });
        if (appUser)
            userId = appUser.id;
        const customer = yield customer_model_1.default.create({
            name, phoneNumber, address: address || '', gstNumber, userId, outstandingAmount: 0
        });
        res.status(201).json(customer);
    }
    catch (error) {
        console.error('Create Customer Error:', error);
        res.status(500).json({ message: 'Error creating customer', error: error.message });
    }
});
exports.createCustomer = createCustomer;
// ─── Get All Customers ────────────────────────────────────────────────────────
const getAllCustomers = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { search } = req.query;
        let whereClause = {};
        if (search) {
            whereClause = {
                [sequelize_1.Op.or]: [
                    { name: { [sequelize_1.Op.iLike]: `%${search}%` } },
                    { phoneNumber: { [sequelize_1.Op.iLike]: `%${search}%` } }
                ]
            };
        }
        const customers = yield customer_model_1.default.findAll({
            where: whereClause,
            order: [['name', 'ASC']]
        });
        res.status(200).json(customers);
    }
    catch (error) {
        console.error('Get Customers Error:', error);
        res.status(500).json({ message: 'Error fetching customers', error: error.message });
    }
});
exports.getAllCustomers = getAllCustomers;
// ─── Get Customer By ID ───────────────────────────────────────────────────────
const getCustomerById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const customer = yield customer_model_1.default.findByPk(req.params.id);
        if (!customer)
            return res.status(404).json({ message: 'Customer not found' });
        res.status(200).json(customer);
    }
    catch (error) {
        console.error('Get Customer Error:', error);
        res.status(500).json({ message: 'Error fetching customer', error: error.message });
    }
});
exports.getCustomerById = getCustomerById;
// ─── Update Customer ──────────────────────────────────────────────────────────
const updateCustomer = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const customer = yield customer_model_1.default.findByPk(req.params.id);
        if (!customer)
            return res.status(404).json({ message: 'Customer not found' });
        const { name, phoneNumber, address, gstNumber } = req.body;
        if (name)
            customer.name = name;
        if (phoneNumber)
            customer.phoneNumber = phoneNumber;
        if (address !== undefined)
            customer.address = address;
        if (gstNumber !== undefined)
            customer.gstNumber = gstNumber;
        yield customer.save();
        res.status(200).json(customer);
    }
    catch (error) {
        console.error('Update Customer Error:', error);
        res.status(500).json({ message: 'Error updating customer', error: error.message });
    }
});
exports.updateCustomer = updateCustomer;
// ─── Search Customers (lightweight for billing UI) ────────────────────────────
const searchCustomers = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { q } = req.query;
        if (!q)
            return res.status(200).json([]);
        const customers = yield customer_model_1.default.findAll({
            where: {
                [sequelize_1.Op.or]: [
                    { name: { [sequelize_1.Op.iLike]: `%${q}%` } },
                    { phoneNumber: { [sequelize_1.Op.iLike]: `%${q}%` } }
                ]
            },
            limit: 10,
            attributes: ['id', 'name', 'phoneNumber', 'outstandingAmount'],
            order: [['name', 'ASC']]
        });
        res.status(200).json(customers);
    }
    catch (error) {
        console.error('Search Customers Error:', error);
        res.status(500).json({ message: 'Error searching customers', error: error.message });
    }
});
exports.searchCustomers = searchCustomers;
