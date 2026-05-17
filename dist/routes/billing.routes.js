"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const billing_controller_1 = require("../controllers/billing.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
// Admin routes
router.post('/invoice', auth_middleware_1.protect, auth_middleware_1.adminOnly, billing_controller_1.createInvoice);
router.get('/invoices', auth_middleware_1.protect, auth_middleware_1.adminOnly, billing_controller_1.getAllInvoices);
router.get('/customer/:customerId', auth_middleware_1.protect, auth_middleware_1.adminOnly, billing_controller_1.getInvoicesByCustomer);
router.get('/invoice/:id', auth_middleware_1.protect, billing_controller_1.getInvoiceById);
router.put('/invoice/:id/cancel', auth_middleware_1.protect, auth_middleware_1.adminOnly, billing_controller_1.cancelInvoice);
// User app route
router.get('/user-invoices', auth_middleware_1.protect, billing_controller_1.getUserInvoices);
router.post('/online-order', auth_middleware_1.protect, billing_controller_1.createOnlineOrder);
// Admin Online Order routes
router.get('/pending-online', auth_middleware_1.protect, auth_middleware_1.adminOnly, billing_controller_1.getPendingOnlineOrders);
router.put('/invoice/:id/approve-online', auth_middleware_1.protect, auth_middleware_1.adminOnly, billing_controller_1.approveOnlineOrder);
exports.default = router;
