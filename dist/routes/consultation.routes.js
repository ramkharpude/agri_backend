"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const consultation_controller_1 = require("../controllers/consultation.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = express_1.default.Router();
router.route('/')
    .post(auth_middleware_1.protect, consultation_controller_1.bookConsultation)
    .get(auth_middleware_1.protect, consultation_controller_1.getConsultations);
exports.default = router;
