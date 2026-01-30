"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const disease_controller_1 = require("../controllers/disease.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const upload_middleware_1 = require("../middleware/upload.middleware");
const router = express_1.default.Router();
router.post('/', auth_middleware_1.protect, upload_middleware_1.upload.array('images', 5), disease_controller_1.reportDisease);
router.get('/', auth_middleware_1.protect, disease_controller_1.getUserDiseases);
router.get('/:id', auth_middleware_1.protect, disease_controller_1.getDiseaseDetails);
router.put('/:id/diagnose', auth_middleware_1.protect, disease_controller_1.diagnoseDisease);
exports.default = router;
