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
const express_1 = __importDefault(require("express"));
const upload_middleware_1 = require("../middleware/upload.middleware");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = express_1.default.Router();
// Route to upload multiple images
// We allow up to 10 images at once to handle both crop stage and product images
router.post('/multiple', auth_middleware_1.protect, upload_middleware_1.upload.array('images', 10), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.files || req.files.length === 0) {
            res.status(400).json({ success: false, message: 'No images uploaded' });
            return;
        }
        const files = req.files;
        // Multer-storage-cloudinary automatically handles the upload and adds the 'path' property
        // representing the secured cloudinary URL.
        const imageUrls = files.map(file => file.path);
        res.status(200).json({
            success: true,
            message: 'Images uploaded successfully',
            imageUrls
        });
    }
    catch (error) {
        console.error('Error uploading multiple images:', error);
        res.status(500).json({ success: false, message: 'Failed to upload images' });
    }
}));
exports.default = router;
