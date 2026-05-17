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
exports.getAdminSoldHistory = exports.getUserSoldHistory = exports.deleteListing = exports.updateListing = exports.updateListingStatus = exports.getAllListings = exports.getAgentListings = exports.getUserListings = exports.createListing = void 0;
const sequelize_1 = require("sequelize");
const agriMarket_model_1 = __importDefault(require("../models/agriMarket.model"));
const user_model_1 = __importDefault(require("../models/user.model"));
// Create a new Agri Market listing
const createListing = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { farmerName, contactNo, fullAddress, cropName, variety, areaInAcres, category, agentName, agentContactNo } = req.body;
        const userId = req.user.id;
        const userRole = req.user.role;
        let imageUrls = [];
        if (req.files && Array.isArray(req.files)) {
            imageUrls = req.files.map(file => file.path);
        }
        const newListing = yield agriMarket_model_1.default.create({
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
            postedBy: userRole && userRole.includes('agent') ? 'agent' : 'farmer',
            agentName: userRole && userRole.includes('agent') ? (agentName || req.user.fullName) : null,
            agentContactNo: userRole && userRole.includes('agent') ? (agentContactNo || req.user.phoneNumber) : null
        });
        res.status(201).json(newListing);
    }
    catch (error) {
        console.error('Create Agri Market Listing Error:', error);
        res.status(500).json({ message: 'Error creating listing', error: error.message });
    }
});
exports.createListing = createListing;
// Get user's active listing history
const getUserListings = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.user.id;
        const tenDaysAgo = new Date();
        tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);
        const listings = yield agriMarket_model_1.default.findAll({
            where: {
                userId,
                [sequelize_1.Op.or]: [
                    { status: 'available' },
                    {
                        status: 'sold',
                        soldAt: { [sequelize_1.Op.gt]: tenDaysAgo }
                    }
                ]
            },
            order: [['createdAt', 'DESC']]
        });
        res.status(200).json(listings);
    }
    catch (error) {
        console.error('Get User Listings Error:', error);
        res.status(500).json({ message: 'Error fetching history', error: error.message });
    }
});
exports.getUserListings = getUserListings;
// Get agent's own listings (same as getUserListings but aliased for clarity)
const getAgentListings = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.user.id;
        const listings = yield agriMarket_model_1.default.findAll({
            where: { userId },
            order: [['createdAt', 'DESC']]
        });
        res.status(200).json(listings);
    }
    catch (error) {
        console.error('Get Agent Listings Error:', error);
        res.status(500).json({ message: 'Error fetching agent listings', error: error.message });
    }
});
exports.getAgentListings = getAgentListings;
// Get all active listings (Admin only)
const getAllListings = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const tenDaysAgo = new Date();
        tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);
        const listings = yield agriMarket_model_1.default.findAll({
            where: {
                [sequelize_1.Op.or]: [
                    { status: 'available' },
                    {
                        status: 'sold',
                        soldAt: { [sequelize_1.Op.gt]: tenDaysAgo }
                    }
                ]
            },
            include: [{ model: user_model_1.default, as: 'user', attributes: ['id', 'phoneNumber'] }],
            order: [['createdAt', 'DESC']]
        });
        res.status(200).json(listings);
    }
    catch (error) {
        console.error('Get All Listings Error:', error);
        res.status(500).json({ message: 'Error fetching listings', error: error.message });
    }
});
exports.getAllListings = getAllListings;
// Update status (Admin only)
const updateListingStatus = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const listing = yield agriMarket_model_1.default.findByPk(id);
        if (!listing) {
            return res.status(404).json({ message: 'Listing not found' });
        }
        listing.status = status;
        if (status === 'sold') {
            listing.soldAt = new Date();
        }
        else {
            listing.soldAt = null;
        }
        yield listing.save();
        res.status(200).json(listing);
    }
    catch (error) {
        console.error('Update Listing Status Error:', error);
        res.status(500).json({ message: 'Error updating status', error: error.message });
    }
});
exports.updateListingStatus = updateListingStatus;
// Update listing (User only)
const updateListing = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { farmerName, contactNo, fullAddress, cropName, variety, areaInAcres, category } = req.body;
        const userId = req.user.id;
        const listing = yield agriMarket_model_1.default.findOne({ where: { id, userId } });
        if (!listing) {
            return res.status(404).json({ message: 'Listing not found or unauthorized' });
        }
        // Check if new images were uploaded
        if (req.files && Array.isArray(req.files) && req.files.length > 0) {
            const newImageUrls = req.files.map(file => file.path);
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
        yield listing.save();
        res.status(200).json(listing);
    }
    catch (error) {
        console.error('Update Listing Error:', error);
        res.status(500).json({ message: 'Error updating listing', error: error.message });
    }
});
exports.updateListing = updateListing;
// Delete listing (User only)
const deleteListing = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const listing = yield agriMarket_model_1.default.findOne({ where: { id, userId } });
        if (!listing) {
            return res.status(404).json({ message: 'Listing not found or unauthorized' });
        }
        yield listing.destroy();
        res.status(200).json({ message: 'Listing deleted successfully' });
    }
    catch (error) {
        console.error('Delete Listing Error:', error);
        res.status(500).json({ message: 'Error deleting listing', error: error.message });
    }
});
exports.deleteListing = deleteListing;
// Get user's sold history (Archived > 10 days)
const getUserSoldHistory = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.user.id;
        const tenDaysAgo = new Date();
        tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);
        const listings = yield agriMarket_model_1.default.findAll({
            where: {
                userId,
                status: 'sold',
                soldAt: { [sequelize_1.Op.lte]: tenDaysAgo }
            },
            order: [['soldAt', 'DESC']]
        });
        res.status(200).json(listings);
    }
    catch (error) {
        console.error('Get User Sold History Error:', error);
        res.status(500).json({ message: 'Error fetching sold history', error: error.message });
    }
});
exports.getUserSoldHistory = getUserSoldHistory;
// Get admin sold history (Archived > 10 days)
const getAdminSoldHistory = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const tenDaysAgo = new Date();
        tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);
        const listings = yield agriMarket_model_1.default.findAll({
            where: {
                status: 'sold',
                soldAt: { [sequelize_1.Op.lte]: tenDaysAgo }
            },
            include: [{ model: user_model_1.default, as: 'user', attributes: ['id', 'phoneNumber'] }],
            order: [['soldAt', 'DESC']]
        });
        res.status(200).json(listings);
    }
    catch (error) {
        console.error('Get Admin Sold History Error:', error);
        res.status(500).json({ message: 'Error fetching sold history', error: error.message });
    }
});
exports.getAdminSoldHistory = getAdminSoldHistory;
