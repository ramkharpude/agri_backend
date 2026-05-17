"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const generalSchedule_controller_1 = require("../controllers/generalSchedule.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = express_1.default.Router();
router.post('/', auth_middleware_1.protect, generalSchedule_controller_1.createGeneralSchedule);
router.get('/', auth_middleware_1.protect, generalSchedule_controller_1.getAllGeneralSchedules);
router.get('/:id', auth_middleware_1.protect, generalSchedule_controller_1.getGeneralScheduleById);
router.put('/:id', auth_middleware_1.protect, generalSchedule_controller_1.updateGeneralSchedule);
router.delete('/:id', auth_middleware_1.protect, generalSchedule_controller_1.deleteGeneralSchedule);
exports.default = router;
