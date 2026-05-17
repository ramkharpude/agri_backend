"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const database_1 = __importDefault(require("../config/database"));
const product_model_1 = __importDefault(require("./product.model"));
class StockMovement extends sequelize_1.Model {
}
StockMovement.init({
    id: { type: sequelize_1.DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    productId: {
        type: sequelize_1.DataTypes.INTEGER, allowNull: false,
        references: { model: product_model_1.default, key: 'id' }
    },
    type: {
        type: sequelize_1.DataTypes.STRING, allowNull: false
        // Values: 'sale', 'purchase', 'adjustment', 'return'
    },
    quantity: { type: sequelize_1.DataTypes.FLOAT, allowNull: false }, // Positive = stock in, Negative = stock out
    previousStock: { type: sequelize_1.DataTypes.FLOAT, allowNull: false },
    newStock: { type: sequelize_1.DataTypes.FLOAT, allowNull: false },
    referenceId: { type: sequelize_1.DataTypes.STRING, allowNull: true }, // Invoice number, etc.
    notes: { type: sequelize_1.DataTypes.TEXT, allowNull: true }
}, {
    sequelize: database_1.default,
    modelName: 'StockMovement',
    tableName: 'stock_movements',
    timestamps: true,
    updatedAt: false
});
// Associations
product_model_1.default.hasMany(StockMovement, { foreignKey: 'productId', as: 'stockMovements' });
StockMovement.belongsTo(product_model_1.default, { foreignKey: 'productId', as: 'product' });
exports.default = StockMovement;
