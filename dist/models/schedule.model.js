"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const database_1 = __importDefault(require("../config/database"));
const plot_model_1 = __importDefault(require("./plot.model"));
class Schedule extends sequelize_1.Model {
}
Schedule.init({
    id: {
        type: sequelize_1.DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    plotId: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        references: { model: plot_model_1.default, key: 'id' }
    },
    title: { type: sequelize_1.DataTypes.STRING, allowNull: false },
    description: { type: sequelize_1.DataTypes.STRING, allowNull: false },
    dayNumber: { type: sequelize_1.DataTypes.INTEGER, allowNull: false },
    status: {
        type: sequelize_1.DataTypes.ENUM('upcoming', 'completed'),
        defaultValue: 'upcoming'
    }
}, {
    sequelize: database_1.default,
    modelName: 'Schedule',
    tableName: 'schedules',
    timestamps: true
});
Schedule.belongsTo(plot_model_1.default, { foreignKey: 'plotId' });
exports.default = Schedule;
