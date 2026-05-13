import express from 'express';
import { createListing, getUserListings, getAllListings, updateListingStatus, updateListing, deleteListing, getUserSoldHistory, getAdminSoldHistory } from '../controllers/agriMarket.controller';
import { protect } from '../middleware/auth.middleware';
import { upload } from '../middleware/upload.middleware';

const router = express.Router();

router.post('/', protect, upload.array('images', 10), createListing);
router.get('/user', protect, getUserListings);
router.get('/admin', protect, getAllListings);
router.get('/admin/history', protect, getAdminSoldHistory);
router.put('/:id/status', protect, updateListingStatus);

// User specific actions on their listing
router.get('/user/history', protect, getUserSoldHistory);
router.put('/:id', protect, upload.array('images', 10), updateListing);
router.delete('/:id', protect, deleteListing);

export default router;
