"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const database_1 = __importDefault(require("../config/database"));
class Achievement extends sequelize_1.Model {
}
Achievement.init({
    id: { type: sequelize_1.DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    title: { type: sequelize_1.DataTypes.STRING, allowNull: false },
    description: { type: sequelize_1.DataTypes.TEXT, allowNull: false },
    photos: {
        type: sequelize_1.DataTypes.JSON,
        allowNull: true,
        defaultValue: []
    },
    likedBy: {
        type: sequelize_1.DataTypes.JSON,
        allowNull: false,
        defaultValue: []
    }
}, {
    sequelize: database_1.default,
    modelName: 'Achievement',
    tableName: 'achievements',
    timestamps: true
});
exports.default = Achievement;
