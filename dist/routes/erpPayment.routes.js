"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const erpPayment_controller_1 = require("../controllers/erpPayment.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
// Admin routes
router.post('/', auth_middleware_1.protect, auth_middleware_1.adminOnly, erpPayment_controller_1.collectPayment);
router.get('/customer/:customerId', auth_middleware_1.protect, auth_middleware_1.adminOnly, erpPayment_controller_1.getPaymentsByCustomer);
router.get('/receipt/:id', auth_middleware_1.protect, erpPayment_controller_1.getPaymentReceipt);
// User app route
router.get('/user-payments', auth_middleware_1.protect, erpPayment_controller_1.getUserPayments);
exports.default = router;
