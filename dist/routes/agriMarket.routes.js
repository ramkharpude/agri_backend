"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const agriMarket_controller_1 = require("../controllers/agriMarket.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const upload_middleware_1 = require("../middleware/upload.middleware");
const router = express_1.default.Router();
router.post('/', auth_middleware_1.protect, upload_middleware_1.upload.array('images', 10), agriMarket_controller_1.createListing);
router.get('/user', auth_middleware_1.protect, agriMarket_controller_1.getUserListings);
router.get('/agent', auth_middleware_1.protect, agriMarket_controller_1.getAgentListings);
router.get('/admin', auth_middleware_1.protect, agriMarket_controller_1.getAllListings);
router.get('/admin/history', auth_middleware_1.protect, agriMarket_controller_1.getAdminSoldHistory);
router.put('/:id/status', auth_middleware_1.protect, agriMarket_controller_1.updateListingStatus);
// User specific actions on their listing
router.get('/user/history', auth_middleware_1.protect, agriMarket_controller_1.getUserSoldHistory);
router.put('/:id', auth_middleware_1.protect, upload_middleware_1.upload.array('images', 10), agriMarket_controller_1.updateListing);
router.delete('/:id', auth_middleware_1.protect, agriMarket_controller_1.deleteListing);
exports.default = router;
