import express from 'express';
import { upload } from '../middleware/upload.middleware';
import { protect } from '../middleware/auth.middleware';
import { Request, Response } from 'express';

const router = express.Router();

// Route to upload multiple images
// We allow up to 10 images at once to handle both crop stage and product images
router.post('/multiple', protect, upload.array('images', 10), async (req: Request, res: Response): Promise<void> => {
    try {
        if (!req.files || (req.files as Express.Multer.File[]).length === 0) {
            res.status(400).json({ success: false, message: 'No images uploaded' });
            return;
        }

        const files = req.files as Express.Multer.File[];

        // Multer-storage-cloudinary automatically handles the upload and adds the 'path' property
        // representing the secured cloudinary URL.
        const imageUrls = files.map(file => file.path);

        res.status(200).json({
            success: true,
            message: 'Images uploaded successfully',
            imageUrls
        });
    } catch (error) {
        console.error('Error uploading multiple images:', error);
        res.status(500).json({ success: false, message: 'Failed to upload images' });
    }
});

export default router;
