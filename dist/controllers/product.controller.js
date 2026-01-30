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
exports.deleteProduct = exports.updateProduct = exports.getProductById = exports.getAllProducts = exports.createProduct = void 0;
const product_model_1 = __importDefault(require("../models/product.model"));
const createProduct = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // console.log("createProduct: Receive body:", req.body);
        // console.log("createProduct: Receive files:", req.files);
        let imageUrls = [];
        if (req.files && Array.isArray(req.files)) {
            imageUrls = req.files.map(file => file.path);
        }
        const productData = Object.assign(Object.assign({}, req.body), { images: imageUrls });
        const product = yield product_model_1.default.create(productData);
        // console.log("createProduct: Success:", product.id);
        res.status(201).json(product);
    }
    catch (error) {
        console.error("Error creating product:", error);
        res.status(500).json({ message: 'Error creating product', error: error instanceof Error ? error.message : error });
    }
});
exports.createProduct = createProduct;
const getAllProducts = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Optional search query
        const products = yield product_model_1.default.findAll({ order: [['createdAt', 'DESC']] });
        res.status(200).json(products);
    }
    catch (error) {
        console.error("Error fetching products:", error);
        res.status(500).json({ message: 'Error fetching products', error });
    }
});
exports.getAllProducts = getAllProducts;
const getProductById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const product = yield product_model_1.default.findByPk(req.params.id);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }
        res.status(200).json(product);
    }
    catch (error) {
        res.status(500).json({ message: 'Error fetching product', error });
    }
});
exports.getProductById = getProductById;
const updateProduct = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const product = yield product_model_1.default.findByPk(req.params.id);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }
        let newImageUrls = [];
        if (req.files && Array.isArray(req.files) && req.files.length > 0) {
            newImageUrls = req.files.map(file => file.path);
        }
        // Handle existing images passed in body
        let existingImages = [];
        if (req.body.images) {
            if (Array.isArray(req.body.images)) {
                existingImages = req.body.images;
            }
            else {
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
        const updateData = Object.assign(Object.assign({}, req.body), { images: finalImages });
        yield product.update(updateData);
        res.status(200).json(product);
    }
    catch (error) {
        res.status(500).json({ message: 'Error updating product', error });
    }
});
exports.updateProduct = updateProduct;
const deleteProduct = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const product = yield product_model_1.default.findByPk(req.params.id);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }
        yield product.destroy();
        res.status(200).json({ message: 'Product deleted successfully' });
    }
    catch (error) {
        res.status(500).json({ message: 'Error deleting product', error });
    }
});
exports.deleteProduct = deleteProduct;
