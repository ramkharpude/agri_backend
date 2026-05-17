"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteGeneralSchedule = exports.updateGeneralSchedule = exports.getGeneralScheduleById = exports.getAllGeneralSchedules = exports.createGeneralSchedule = void 0;
const generalSchedule_model_1 = __importDefault(require("../models/generalSchedule.model"));
const generalScheduleItem_model_1 = __importDefault(require("../models/generalScheduleItem.model"));
const database_1 = __importDefault(require("../config/database"));
// 1. Create a General Schedule with items
const createGeneralSchedule = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const t = yield database_1.default.transaction();
    try {
        const { cropName, variety, items } = req.body;
        if (!cropName || !variety || !items || !Array.isArray(items)) {
            res.status(400).json({ success: false, message: 'cropName, variety, and an array of items are required.' });
            return;
        }
        const newGeneralSchedule = yield generalSchedule_model_1.default.create({
            cropName,
            variety,
            userId: (_a = req.user) === null || _a === void 0 ? void 0 : _a.id
        }, { transaction: t });
        const itemsWithScheduleId = items.map((item) => (Object.assign(Object.assign({}, item), { generalScheduleId: newGeneralSchedule.id, stageImages: item.stageImages || [], productImages: item.productImages || [] })));
        yield generalScheduleItem_model_1.default.bulkCreate(itemsWithScheduleId, { transaction: t });
        yield t.commit();
        const createdSchedule = yield generalSchedule_model_1.default.findByPk(newGeneralSchedule.id, {
            include: [{ model: generalScheduleItem_model_1.default, as: 'items' }]
        });
        res.status(201).json({ success: true, generalSchedule: createdSchedule, message: 'General Schedule created successfully.' });
    }
    catch (error) {
        yield t.rollback();
        console.error('Error creating general schedule:', error);
        res.status(500).json({ success: false, message: 'Error creating general schedule', error });
    }
});
exports.createGeneralSchedule = createGeneralSchedule;
// 2. Get all General Schedules
const getAllGeneralSchedules = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const whereClause = {};
        if (req.user && req.user.role !== 'admin') {
            whereClause.userId = req.user.id;
        }
        const schedules = yield generalSchedule_model_1.default.findAll({
            where: whereClause,
            include: [{ model: generalScheduleItem_model_1.default, as: 'items' }],
            order: [['createdAt', 'DESC']]
        });
        res.json({ success: true, generalSchedules: schedules });
    }
    catch (error) {
        console.error('Error fetching general schedules:', error);
        res.status(500).json({ success: false, message: 'Error fetching general schedules', error });
    }
});
exports.getAllGeneralSchedules = getAllGeneralSchedules;
// 3. Get General Schedule by ID
const getGeneralScheduleById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const schedule = yield generalSchedule_model_1.default.findByPk(id, {
            include: [{ model: generalScheduleItem_model_1.default, as: 'items' }]
        });
        if (!schedule) {
            res.status(404).json({ success: false, message: 'General Schedule not found' });
            return;
        }
        if (req.user && req.user.role !== 'admin' && schedule.userId !== req.user.id) {
            res.status(403).json({ success: false, message: 'Not authorized to view this schedule' });
            return;
        }
        res.json({ success: true, generalSchedule: schedule });
    }
    catch (error) {
        console.error('Error fetching general schedule:', error);
        res.status(500).json({ success: false, message: 'Error fetching general schedule', error });
    }
});
exports.getGeneralScheduleById = getGeneralScheduleById;
// 4. Update General Schedule
const updateGeneralSchedule = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const t = yield database_1.default.transaction();
    try {
        const { id } = req.params;
        const { cropName, variety, items } = req.body;
        const schedule = yield generalSchedule_model_1.default.findByPk(id, { transaction: t });
        if (!schedule) {
            yield t.rollback();
            res.status(404).json({ success: false, message: 'General Schedule not found' });
            return;
        }
        if (req.user && req.user.role !== 'admin' && schedule.userId !== req.user.id) {
            yield t.rollback();
            res.status(403).json({ success: false, message: 'Not authorized to update this schedule' });
            return;
        }
        if (cropName)
            schedule.cropName = cropName;
        if (variety)
            schedule.variety = variety;
        yield schedule.save({ transaction: t });
        if (items && Array.isArray(items)) {
            // Option: delete all old items and insert all new items.
            yield generalScheduleItem_model_1.default.destroy({ where: { generalScheduleId: id }, transaction: t });
            const itemsWithScheduleId = items.map((item) => (Object.assign(Object.assign({}, item), { generalScheduleId: id, stageImages: item.stageImages || [], productImages: item.productImages || [] })));
            yield generalScheduleItem_model_1.default.bulkCreate(itemsWithScheduleId, { transaction: t });
        }
        yield t.commit();
        const updatedSchedule = yield generalSchedule_model_1.default.findByPk(id, {
            include: [{ model: generalScheduleItem_model_1.default, as: 'items' }]
        });
        res.json({ success: true, generalSchedule: updatedSchedule, message: 'General Schedule updated successfully.' });
    }
    catch (error) {
        yield t.rollback();
        console.error('Error updating general schedule:', error);
        res.status(500).json({ success: false, message: 'Error updating general schedule', error });
    }
});
exports.updateGeneralSchedule = updateGeneralSchedule;
// 5. Delete General Schedule
const deleteGeneralSchedule = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const schedule = yield generalSchedule_model_1.default.findByPk(id);
        if (!schedule) {
            res.status(404).json({ success: false, message: 'General Schedule not found' });
            return;
        }
        if (req.user && req.user.role !== 'admin' && schedule.userId !== req.user.id) {
            res.status(403).json({ success: false, message: 'Not authorized to delete this schedule' });
            return;
        }
        // Deleting the schedule will also cascade-delete the items
        yield schedule.destroy();
        res.json({ success: true, message: 'General Schedule deleted successfully.' });
    }
    catch (error) {
        console.error('Error deleting general schedule:', error);
        res.status(500).json({ success: false, message: 'Error deleting general schedule', error });
    }
});
exports.deleteGeneralSchedule = deleteGeneralSchedule;
