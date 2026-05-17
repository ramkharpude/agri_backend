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
exports.adjustStock = exports.getProductStockHistory = void 0;
const stockMovement_model_1 = __importDefault(require("../models/stockMovement.model"));
const product_model_1 = __importDefault(require("../models/product.model"));
const database_1 = __importDefault(require("../config/database"));
// ─── Get Product Stock History ────────────────────────────────────────────────
const getProductStockHistory = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { productId } = req.params;
        const product = yield product_model_1.default.findByPk(productId, {
            attributes: ['id', 'name', 'stock', 'unit']
        });
        if (!product)
            return res.status(404).json({ message: 'Product not found' });
        const movements = yield stockMovement_model_1.default.findAll({
            where: { productId },
            order: [['createdAt', 'DESC']],
            limit: 100
        });
        res.status(200).json({ product, movements });
    }
    catch (error) {
        console.error('Stock History Error:', error);
        res.status(500).json({ message: 'Error fetching stock history', error: error.message });
    }
});
exports.getProductStockHistory = getProductStockHistory;
// ─── Manual Stock Adjustment ──────────────────────────────────────────────────
const adjustStock = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const transaction = yield database_1.default.transaction();
    try {
        const { productId, quantity, type, notes } = req.body;
        if (!productId || quantity === undefined || !type) {
            yield transaction.rollback();
            return res.status(400).json({ message: 'Product ID, quantity, and type are required' });
        }
        const product = yield product_model_1.default.findByPk(productId, { transaction, lock: true });
        if (!product) {
            yield transaction.rollback();
            return res.status(404).json({ message: 'Product not found' });
        }
        const previousStock = product.stock;
        let newStock = previousStock;
        if (type === 'purchase' || type === 'return') {
            newStock = previousStock + Math.abs(quantity);
        }
        else if (type === 'adjustment') {
            newStock = quantity; // Direct set
        }
        else {
            yield transaction.rollback();
            return res.status(400).json({ message: 'Invalid adjustment type' });
        }
        if (newStock < 0) {
            yield transaction.rollback();
            return res.status(400).json({ message: 'Stock cannot be negative' });
        }
        yield product.update({ stock: newStock }, { transaction });
        const movement = yield stockMovement_model_1.default.create({
            productId,
            type,
            quantity: newStock - previousStock,
            previousStock,
            newStock,
            notes: notes || `Manual ${type} adjustment`
        }, { transaction });
        yield transaction.commit();
        res.status(200).json({ product, movement });
    }
    catch (error) {
        yield transaction.rollback();
        console.error('Stock Adjustment Error:', error);
        res.status(500).json({ message: 'Error adjusting stock', error: error.message });
    }
});
exports.adjustStock = adjustStock;
