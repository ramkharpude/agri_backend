"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const database_1 = __importDefault(require("../config/database"));
class Product extends sequelize_1.Model {
}
Product.init({
    id: {
        type: sequelize_1.DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    name: { type: sequelize_1.DataTypes.STRING, allowNull: false },
    description: { type: sequelize_1.DataTypes.TEXT, allowNull: false },
    category: { type: sequelize_1.DataTypes.STRING, allowNull: false },
    company: { type: sequelize_1.DataTypes.STRING, allowNull: false },
    price: { type: sequelize_1.DataTypes.FLOAT, allowNull: false },
    offerPrice: { type: sequelize_1.DataTypes.FLOAT, allowNull: true },
    offer: { type: sequelize_1.DataTypes.STRING, allowNull: true },
    stock: { type: sequelize_1.DataTypes.INTEGER, defaultValue: 0 },
    image: { type: sequelize_1.DataTypes.TEXT, allowNull: true },
    images: { type: sequelize_1.DataTypes.JSON, allowNull: true }, // Store multiple images as JSON array
    // ERP Fields
    hsn: { type: sequelize_1.DataTypes.STRING, allowNull: true },
    barcode: { type: sequelize_1.DataTypes.STRING, allowNull: true },
    purchasePrice: { type: sequelize_1.DataTypes.FLOAT, allowNull: true },
    unit: { type: sequelize_1.DataTypes.STRING, allowNull: false, defaultValue: 'piece' },
    lowStockThreshold: { type: sequelize_1.DataTypes.INTEGER, allowNull: false, defaultValue: 10 },
    batchNumber: { type: sequelize_1.DataTypes.STRING, allowNull: true },
    expiryDate: { type: sequelize_1.DataTypes.DATE, allowNull: true }
}, {
    sequelize: database_1.default,
    modelName: 'Product',
    tableName: 'products',
    timestamps: true
});
exports.default = Product;
