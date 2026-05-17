"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const database_1 = __importDefault(require("../config/database"));
class GeneralSchedule extends sequelize_1.Model {
}
GeneralSchedule.init({
    id: {
        type: sequelize_1.DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    cropName: { type: sequelize_1.DataTypes.STRING, allowNull: false },
    variety: { type: sequelize_1.DataTypes.STRING, allowNull: false },
    userId: { type: sequelize_1.DataTypes.INTEGER, allowNull: true } // Nullable for backwards compatibility with existing templates
}, {
    sequelize: database_1.default,
    modelName: 'GeneralSchedule',
    tableName: 'general_schedules',
    timestamps: true
});
exports.default = GeneralSchedule;
