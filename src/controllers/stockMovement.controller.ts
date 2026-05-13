import { Request, Response } from 'express';
import StockMovement from '../models/stockMovement.model';
import Product from '../models/product.model';
import sequelize from '../config/database';

// ─── Get Product Stock History ────────────────────────────────────────────────
export const getProductStockHistory = async (req: Request, res: Response) => {
    try {
        const { productId } = req.params;

        const product = await Product.findByPk(productId, {
            attributes: ['id', 'name', 'stock', 'unit']
        });
        if (!product) return res.status(404).json({ message: 'Product not found' });

        const movements = await StockMovement.findAll({
            where: { productId },
            order: [['createdAt', 'DESC']],
            limit: 100
        });

        res.status(200).json({ product, movements });
    } catch (error) {
        console.error('Stock History Error:', error);
        res.status(500).json({ message: 'Error fetching stock history', error: (error as any).message });
    }
};

// ─── Manual Stock Adjustment ──────────────────────────────────────────────────
export const adjustStock = async (req: Request, res: Response) => {
    const transaction = await sequelize.transaction();

    try {
        const { productId, quantity, type, notes } = req.body;

        if (!productId || quantity === undefined || !type) {
            await transaction.rollback();
            return res.status(400).json({ message: 'Product ID, quantity, and type are required' });
        }

        const product = await Product.findByPk(productId, { transaction, lock: true });
        if (!product) {
            await transaction.rollback();
            return res.status(404).json({ message: 'Product not found' });
        }

        const previousStock = product.stock;
        let newStock = previousStock;

        if (type === 'purchase' || type === 'return') {
            newStock = previousStock + Math.abs(quantity);
        } else if (type === 'adjustment') {
            newStock = quantity; // Direct set
        } else {
            await transaction.rollback();
            return res.status(400).json({ message: 'Invalid adjustment type' });
        }

        if (newStock < 0) {
            await transaction.rollback();
            return res.status(400).json({ message: 'Stock cannot be negative' });
        }

        await product.update({ stock: newStock }, { transaction });

        const movement = await StockMovement.create({
            productId,
            type,
            quantity: newStock - previousStock,
            previousStock,
            newStock,
            notes: notes || `Manual ${type} adjustment`
        }, { transaction });

        await transaction.commit();

        res.status(200).json({ product, movement });
    } catch (error) {
        await transaction.rollback();
        console.error('Stock Adjustment Error:', error);
        res.status(500).json({ message: 'Error adjusting stock', error: (error as any).message });
    }
};
