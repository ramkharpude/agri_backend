"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const database_1 = __importDefault(require("../config/database"));
const user_model_1 = __importDefault(require("./user.model"));
class Notification extends sequelize_1.Model {
}
Notification.init({
    id: {
        type: sequelize_1.DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    userId: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        references: { model: user_model_1.default, key: 'id' }
    },
    title: { type: sequelize_1.DataTypes.STRING, allowNull: false },
    message: { type: sequelize_1.DataTypes.STRING, allowNull: false },
    type: { type: sequelize_1.DataTypes.STRING, allowNull: false },
    relatedId: { type: sequelize_1.DataTypes.STRING, allowNull: true },
    isRead: { type: sequelize_1.DataTypes.BOOLEAN, defaultValue: false }
}, {
    sequelize: database_1.default,
    modelName: 'Notification',
    tableName: 'notifications',
    timestamps: true
});
Notification.belongsTo(user_model_1.default, { foreignKey: 'userId' });
exports.default = Notification;
