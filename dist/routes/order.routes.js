"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const order_controller_1 = require("../controllers/order.controller");
const router = (0, express_1.Router)();
router.post('/', order_controller_1.createOrder);
router.get('/user/:userId', order_controller_1.getUserOrders); // Get all orders for a user
router.get('/all/orders', order_controller_1.getAllOrders);
router.get('/analytics', order_controller_1.getShopAnalytics); // [ADMIN] Analytics Endpoint
router.get('/:id', order_controller_1.getOrderById);
router.put('/:id/status', order_controller_1.updateOrderStatus); // [ADMIN] Update Status
exports.default = router;
