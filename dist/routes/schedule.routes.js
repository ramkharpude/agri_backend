"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const schedule_controller_1 = require("../controllers/schedule.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = express_1.default.Router();
router.get('/:plotId', auth_middleware_1.protect, schedule_controller_1.getPlotSchedules);
router.post('/', auth_middleware_1.protect, schedule_controller_1.createSchedule);
router.put('/:id', auth_middleware_1.protect, schedule_controller_1.updateSchedule);
router.delete('/:id', auth_middleware_1.protect, schedule_controller_1.deleteSchedule);
router.put('/:id/status', auth_middleware_1.protect, schedule_controller_1.updateScheduleStatus);
exports.default = router;
