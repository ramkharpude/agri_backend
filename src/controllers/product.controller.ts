import { Request, Response } from 'express';
import Product from '../models/product.model';

export const createProduct = async (req: Request, res: Response) => {
    try {
        let imageUrls: string[] = [];

        if (req.files && Array.isArray(req.files)) {
            imageUrls = (req.files as Express.Multer.File[]).map(file => file.path);
        }

        const productData = {
            ...req.body,
            images: imageUrls
        };

        const product = await Product.create(productData);
        res.status(201).json(product);
    } catch (error) {
        console.error("Error creating product:", error);
        res.status(500).json({ message: 'Error creating product', error: error instanceof Error ? error.message : error });
    }
};

export const getAllProducts = async (req: Request, res: Response) => {
    try {
        // Optional search query
        const products = await Product.findAll({ order: [['createdAt', 'DESC']] });
        res.status(200).json(products);
    } catch (error) {
        console.error("Error fetching products:", error);
        res.status(500).json({ message: 'Error fetching products', error });
    }
};

export const getProductById = async (req: Request, res: Response) => {
    try {
        const product = await Product.findByPk(req.params.id);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }
        res.status(200).json(product);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching product', error });
    }
};

export const updateProduct = async (req: Request, res: Response) => {
    try {
        const product = await Product.findByPk(req.params.id);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        let newImageUrls: string[] = [];
        if (req.files && Array.isArray(req.files) && req.files.length > 0) {
            newImageUrls = (req.files as Express.Multer.File[]).map(file => file.path);
        }

        // Handle existing images passed in body
        let existingImages: string[] = [];
        if (req.body.images) {
            if (Array.isArray(req.body.images)) {
                existingImages = req.body.images;
            } else {
                existingImages = [req.body.images];
            }
        }

        // Combine existing (preserved) images and new uploads
        let finalImages = [...existingImages, ...newImageUrls];

        const updateData = {
            ...req.body,
            images: finalImages
        };

        await product.update(updateData);
        res.status(200).json(product);
    } catch (error) {
        res.status(500).json({ message: 'Error updating product', error });
    }
};

export const deleteProduct = async (req: Request, res: Response) => {
    try {
        const product = await Product.findByPk(req.params.id);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }
        await product.destroy();
        res.status(200).json({ message: 'Product deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting product', error });
    }
};
