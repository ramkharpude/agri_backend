import { Request, Response } from 'express';
import Product from '../models/product.model';

export const createProduct = async (req: Request, res: Response) => {
    try {
        // console.log("createProduct: Receive body:", req.body);
        // console.log("createProduct: Receive files:", req.files);

        let imageUrls: string[] = [];

        if (req.files && Array.isArray(req.files)) {
            imageUrls = (req.files as Express.Multer.File[]).map(file => file.path);
        }

        const productData = {
            ...req.body,
            images: imageUrls
        };

        const product = await Product.create(productData);
        // console.log("createProduct: Success:", product.id);
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
        // If no images sent in body and no files, it arguably keeps nothing? 
        // Or should it default to *current* DB images if nothing sent?
        // Usually, in PUT/PATCH, if field is missing, keep old. If sent (empty), clear.
        // But with FormData, it's hard to "omit". 
        // Let's assume if client sends ANY image data (text or file), we update. 
        // If client sends NOTHING, we could keep old. 
        // But let's simplify: Helper function constructs list.

        let finalImages = [...existingImages, ...newImageUrls];

        // If user deleted all images in UI, existingImages would be empty.
        // If they didn't touch images, UI should send existing ones back.
        // So this logic holds.

        // Special case: if we want to "keep" old images when NO changes made,
        // CLIENT must send them.

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
