"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const plot_controller_1 = require("../controllers/plot.controller");
const auth_middleware_1 = require("../middleware/auth.middleware"); // Assuming auth middleware exists
const router = express_1.default.Router();
router.post('/', auth_middleware_1.protect, plot_controller_1.createPlot);
router.get('/', auth_middleware_1.protect, plot_controller_1.getUserPlots);
router.get('/history', auth_middleware_1.protect, plot_controller_1.getPlotHistory); // Specific path before param
router.get('/:id', auth_middleware_1.protect, plot_controller_1.getPlotById);
router.put('/:id/complete', auth_middleware_1.protect, plot_controller_1.completePlot);
exports.default = router;
