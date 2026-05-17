"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const plotAssignment_controller_1 = require("../controllers/plotAssignment.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = express_1.default.Router();
router.post('/', auth_middleware_1.protect, plotAssignment_controller_1.assignPlotToConsultant); // Admin: assign
router.delete('/:id', auth_middleware_1.protect, plotAssignment_controller_1.unassignPlot); // Admin: unassign
router.get('/consultant', auth_middleware_1.protect, plotAssignment_controller_1.getMyAssignedPlots); // Consultant: my plots
router.get('/plot/:plotId', auth_middleware_1.protect, plotAssignment_controller_1.getPlotConsultants); // Admin: who is assigned
router.get('/consultants', auth_middleware_1.protect, plotAssignment_controller_1.getApprovedConsultants); // Admin: list all approved consultants
exports.default = router;
