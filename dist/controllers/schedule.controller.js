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
exports.updateScheduleStatus = exports.deleteSchedule = exports.updateSchedule = exports.createSchedule = exports.getPlotSchedules = void 0;
const schedule_model_1 = __importDefault(require("../models/schedule.model"));
// Get schedules for a specific plot
const getPlotSchedules = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { plotId } = req.params;
        // console.log(`[SCHEDULE] Fetching schedules for plotId: ${plotId}`);
        const schedules = yield schedule_model_1.default.findAll({
            where: { plotId },
            order: [['dayNumber', 'ASC']]
        });
        res.status(200).json(schedules);
    }
    catch (error) {
        console.error('Get Schedules Error:', error);
        res.status(500).json({ message: 'Error fetching schedules', error: error.message });
    }
});
exports.getPlotSchedules = getPlotSchedules;
// Create a schedule (Internal/Admin use)
const createSchedule = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { plotId, title, description, dayNumber } = req.body;
        const newSchedule = yield schedule_model_1.default.create({
            plotId,
            title,
            description,
            dayNumber
        });
        res.status(201).json(newSchedule);
    }
    catch (error) {
        res.status(500).json({ message: 'Error creating schedule', error: error.message });
    }
});
exports.createSchedule = createSchedule;
// Update a schedule (Admin use)
const updateSchedule = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { title, description, dayNumber } = req.body;
        const schedule = yield schedule_model_1.default.findByPk(id);
        if (!schedule) {
            return res.status(404).json({ message: 'Schedule not found' });
        }
        yield schedule.update({ title, description, dayNumber });
        res.status(200).json(schedule);
    }
    catch (error) {
        res.status(500).json({ message: 'Error updating schedule', error: error.message });
    }
});
exports.updateSchedule = updateSchedule;
// Delete a schedule (Admin use)
const deleteSchedule = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const schedule = yield schedule_model_1.default.findByPk(id);
        if (!schedule) {
            return res.status(404).json({ message: 'Schedule not found' });
        }
        yield schedule.destroy();
        res.status(200).json({ message: 'Schedule deleted successfully' });
    }
    catch (error) {
        res.status(500).json({ message: 'Error deleting schedule', error: error.message });
    }
});
exports.deleteSchedule = deleteSchedule;
// Update schedule status (User use)
const updateScheduleStatus = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { status } = req.body;
        if (!['upcoming', 'completed'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }
        const schedule = yield schedule_model_1.default.findByPk(id);
        if (!schedule) {
            return res.status(404).json({ message: 'Schedule not found' });
        }
        // Removed validation to allow status toggle
        // if (schedule.status === 'completed') {
        //    return res.status(400).json({ message: 'Cannot change status of a completed schedule' });
        // }
        schedule.status = status;
        yield schedule.save();
        res.status(200).json(schedule);
    }
    catch (error) {
        res.status(500).json({ message: 'Error updating status', error: error.message });
    }
});
exports.updateScheduleStatus = updateScheduleStatus;
