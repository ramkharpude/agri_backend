"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const database_1 = __importDefault(require("../config/database"));
const invoice_model_1 = __importDefault(require("./invoice.model"));
const product_model_1 = __importDefault(require("./product.model"));
class InvoiceItem extends sequelize_1.Model {
}
InvoiceItem.init({
    id: { type: sequelize_1.DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    invoiceId: {
        type: sequelize_1.DataTypes.INTEGER, allowNull: false,
        references: { model: invoice_model_1.default, key: 'id' }
    },
    productId: {
        type: sequelize_1.DataTypes.INTEGER, allowNull: false,
        references: { model: product_model_1.default, key: 'id' }
    },
    productName: { type: sequelize_1.DataTypes.STRING, allowNull: false },
    quantity: { type: sequelize_1.DataTypes.FLOAT, allowNull: false },
    unit: { type: sequelize_1.DataTypes.STRING, allowNull: false, defaultValue: 'piece' },
    rate: { type: sequelize_1.DataTypes.FLOAT, allowNull: false },
    amount: { type: sequelize_1.DataTypes.FLOAT, allowNull: false } // quantity × rate
}, {
    sequelize: database_1.default,
    modelName: 'InvoiceItem',
    tableName: 'invoice_items',
    timestamps: false
});
// Associations
invoice_model_1.default.hasMany(InvoiceItem, { foreignKey: 'invoiceId', as: 'items' });
InvoiceItem.belongsTo(invoice_model_1.default, { foreignKey: 'invoiceId' });
InvoiceItem.belongsTo(product_model_1.default, { foreignKey: 'productId' });
exports.default = InvoiceItem;
