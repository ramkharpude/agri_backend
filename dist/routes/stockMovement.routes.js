"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const stockMovement_controller_1 = require("../controllers/stockMovement.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const ledger_controller_1 = require("../controllers/ledger.controller");
const router = (0, express_1.Router)();
// Stock movements
router.get('/product/:productId', auth_middleware_1.protect, auth_middleware_1.adminOnly, stockMovement_controller_1.getProductStockHistory);
router.post('/adjust', auth_middleware_1.protect, auth_middleware_1.adminOnly, stockMovement_controller_1.adjustStock);
// Ledger
router.get('/ledger/:customerId', auth_middleware_1.protect, auth_middleware_1.adminOnly, ledger_controller_1.getCustomerLedger);
router.get('/outstanding', auth_middleware_1.protect, auth_middleware_1.adminOnly, ledger_controller_1.getOutstandingSummary);
// User app route
router.get('/user-udhari', auth_middleware_1.protect, ledger_controller_1.getUserUdhari);
exports.default = router;
