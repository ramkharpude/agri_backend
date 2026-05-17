"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const database_1 = __importDefault(require("../config/database"));
const generalSchedule_model_1 = __importDefault(require("./generalSchedule.model"));
class GeneralScheduleItem extends sequelize_1.Model {
}
GeneralScheduleItem.init({
    id: {
        type: sequelize_1.DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    generalScheduleId: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        references: { model: generalSchedule_model_1.default, key: 'id' },
        onDelete: 'CASCADE'
    },
    title: { type: sequelize_1.DataTypes.STRING, allowNull: false },
    description: { type: sequelize_1.DataTypes.STRING, allowNull: false },
    dayNumber: { type: sequelize_1.DataTypes.INTEGER, allowNull: false },
    stageImages: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: true,
        get() {
            const rawValue = this.getDataValue('stageImages');
            return rawValue ? JSON.parse(rawValue) : [];
        },
        set(value) {
            this.setDataValue('stageImages', JSON.stringify(value));
        }
    },
    productImages: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: true,
        get() {
            const rawValue = this.getDataValue('productImages');
            return rawValue ? JSON.parse(rawValue) : [];
        },
        set(value) {
            this.setDataValue('productImages', JSON.stringify(value));
        }
    }
}, {
    sequelize: database_1.default,
    modelName: 'GeneralScheduleItem',
    tableName: 'general_schedule_items',
    timestamps: true
});
GeneralScheduleItem.belongsTo(generalSchedule_model_1.default, { foreignKey: 'generalScheduleId' });
generalSchedule_model_1.default.hasMany(GeneralScheduleItem, { foreignKey: 'generalScheduleId', as: 'items' });
exports.default = GeneralScheduleItem;
