"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const database_1 = __importDefault(require("../config/database"));
class Customer extends sequelize_1.Model {
}
Customer.init({
    id: { type: sequelize_1.DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    userId: { type: sequelize_1.DataTypes.INTEGER, allowNull: true, defaultValue: null },
    name: { type: sequelize_1.DataTypes.STRING, allowNull: false },
    phoneNumber: { type: sequelize_1.DataTypes.STRING, allowNull: false, unique: true },
    address: { type: sequelize_1.DataTypes.TEXT, allowNull: true, defaultValue: '' },
    gstNumber: { type: sequelize_1.DataTypes.STRING, allowNull: true },
    outstandingAmount: { type: sequelize_1.DataTypes.FLOAT, allowNull: false, defaultValue: 0 }
}, {
    sequelize: database_1.default,
    modelName: 'Customer',
    tableName: 'customers',
    timestamps: true
});
exports.default = Customer;
