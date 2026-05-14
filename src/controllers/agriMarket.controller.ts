import { Request, Response } from 'express';
import { Op } from 'sequelize';
import AgriMarket from '../models/agriMarket.model';
import User from '../models/user.model';
import { AuthRequest } from '../middleware/auth.middleware';

// Create a new Agri Market listing
export const createListing = async (req: AuthRequest, res: Response) => {
    try {
        const { farmerName, contactNo, fullAddress, cropName, variety, areaInAcres, category, agentName, agentContactNo } = req.body;
        const userId = req.user.id;
        const userRole = req.user.role;

        let imageUrls: string[] = [];

        if (req.files && Array.isArray(req.files)) {
            imageUrls = (req.files as Express.Multer.File[]).map(file => file.path);
        }

        const newListing = await AgriMarket.create({
            userId,
            farmerName,
            contactNo,
            fullAddress,
            cropName,
            variety,
            areaInAcres: parseFloat(areaInAcres),
            category,
            photos: imageUrls,
            status: 'available',
            postedBy: userRole === 'agent' ? 'agent' : 'farmer',
            agentName: userRole === 'agent' ? (agentName || req.user.fullName) : null,
            agentContactNo: userRole === 'agent' ? (agentContactNo || req.user.phoneNumber) : null
        });

        res.status(201).json(newListing);
    } catch (error) {
        console.error('Create Agri Market Listing Error:', error);
        res.status(500).json({ message: 'Error creating listing', error: (error as any).message });
    }
};

// Get user's active listing history
export const getUserListings = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user.id;
        const tenDaysAgo = new Date();
        tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);

        const listings = await AgriMarket.findAll({
            where: { 
                userId,
                [Op.or]: [
                    { status: 'available' },
                    { 
                        status: 'sold',
                        soldAt: { [Op.gt]: tenDaysAgo }
                    }
                ]
            },
            order: [['createdAt', 'DESC']]
        });
        res.status(200).json(listings);
    } catch (error) {
        console.error('Get User Listings Error:', error);
        res.status(500).json({ message: 'Error fetching history', error: (error as any).message });
    }
};

// Get agent's own listings (same as getUserListings but aliased for clarity)
export const getAgentListings = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user.id;
        const listings = await AgriMarket.findAll({
            where: { userId },
            order: [['createdAt', 'DESC']]
        });
        res.status(200).json(listings);
    } catch (error) {
        console.error('Get Agent Listings Error:', error);
        res.status(500).json({ message: 'Error fetching agent listings', error: (error as any).message });
    }
};

// Get all active listings (Admin only)
export const getAllListings = async (req: Request, res: Response) => {
    try {
        const tenDaysAgo = new Date();
        tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);

        const listings = await AgriMarket.findAll({
            where: {
                [Op.or]: [
                    { status: 'available' },
                    { 
                        status: 'sold',
                        soldAt: { [Op.gt]: tenDaysAgo }
                    }
                ]
            },
            include: [{ model: User, as: 'user', attributes: ['id', 'phoneNumber'] }],
            order: [['createdAt', 'DESC']]
        });
        res.status(200).json(listings);
    } catch (error) {
        console.error('Get All Listings Error:', error);
        res.status(500).json({ message: 'Error fetching listings', error: (error as any).message });
    }
};

// Update status (Admin only)
export const updateListingStatus = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const listing = await AgriMarket.findByPk(id);
        if (!listing) {
            return res.status(404).json({ message: 'Listing not found' });
        }

        listing.status = status;
        if (status === 'sold') {
            listing.soldAt = new Date();
        } else {
            listing.soldAt = null;
        }
        await listing.save();

        res.status(200).json(listing);
    } catch (error) {
        console.error('Update Listing Status Error:', error);
        res.status(500).json({ message: 'Error updating status', error: (error as any).message });
    }
};

// Update listing (User only)
export const updateListing = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const { farmerName, contactNo, fullAddress, cropName, variety, areaInAcres, category } = req.body;
        const userId = req.user.id;

        const listing = await AgriMarket.findOne({ where: { id, userId } });

        if (!listing) {
            return res.status(404).json({ message: 'Listing not found or unauthorized' });
        }

        // Check if new images were uploaded
        if (req.files && Array.isArray(req.files) && req.files.length > 0) {
            const newImageUrls = (req.files as Express.Multer.File[]).map(file => file.path);
            listing.photos = newImageUrls; // Overwrite old photos
        }

        // Update text fields
        listing.farmerName = farmerName || listing.farmerName;
        listing.contactNo = contactNo || listing.contactNo;
        listing.fullAddress = fullAddress || listing.fullAddress;
        listing.cropName = cropName || listing.cropName;
        listing.variety = variety || listing.variety;
        listing.areaInAcres = areaInAcres ? parseFloat(areaInAcres) : listing.areaInAcres;
        listing.category = category || listing.category;

        await listing.save();

        res.status(200).json(listing);
    } catch (error) {
        console.error('Update Listing Error:', error);
        res.status(500).json({ message: 'Error updating listing', error: (error as any).message });
    }
};

// Delete listing (User only)
export const deleteListing = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const listing = await AgriMarket.findOne({ where: { id, userId } });

        if (!listing) {
            return res.status(404).json({ message: 'Listing not found or unauthorized' });
        }

        await listing.destroy();

        res.status(200).json({ message: 'Listing deleted successfully' });
    } catch (error) {
        console.error('Delete Listing Error:', error);
        res.status(500).json({ message: 'Error deleting listing', error: (error as any).message });
    }
};

// Get user's sold history (Archived > 10 days)
export const getUserSoldHistory = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user.id;
        const tenDaysAgo = new Date();
        tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);

        const listings = await AgriMarket.findAll({
            where: { 
                userId,
                status: 'sold',
                soldAt: { [Op.lte]: tenDaysAgo }
            },
            order: [['soldAt', 'DESC']]
        });
        res.status(200).json(listings);
    } catch (error) {
        console.error('Get User Sold History Error:', error);
        res.status(500).json({ message: 'Error fetching sold history', error: (error as any).message });
    }
};

// Get admin sold history (Archived > 10 days)
export const getAdminSoldHistory = async (req: Request, res: Response) => {
    try {
        const tenDaysAgo = new Date();
        tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);

        const listings = await AgriMarket.findAll({
            where: {
                status: 'sold',
                soldAt: { [Op.lte]: tenDaysAgo }
            },
            include: [{ model: User, as: 'user', attributes: ['id', 'phoneNumber'] }],
            order: [['soldAt', 'DESC']]
        });
        res.status(200).json(listings);
    } catch (error) {
        console.error('Get Admin Sold History Error:', error);
        res.status(500).json({ message: 'Error fetching sold history', error: (error as any).message });
    }
};
