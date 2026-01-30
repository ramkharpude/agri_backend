"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_controller_1 = require("../controllers/auth.controller");
const router = express_1.default.Router();
router.post('/send-otp', auth_controller_1.sendOtp);
router.post('/verify-otp', auth_controller_1.verifyOtpAndLogin);
router.post('/register', auth_controller_1.register);
router.post('/check-user', auth_controller_1.checkUser);
router.post('/admin-login', auth_controller_1.adminLogin);
// Protected Routes
const auth_middleware_1 = require("../middleware/auth.middleware");
router.post('/update-fcm-token', auth_middleware_1.protect, auth_controller_1.updateFcmToken);
exports.default = router;
