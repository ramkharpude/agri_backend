"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const database_1 = __importDefault(require("../config/database"));
const customer_model_1 = __importDefault(require("./customer.model"));
class Invoice extends sequelize_1.Model {
}
Invoice.init({
    id: { type: sequelize_1.DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    invoiceNumber: { type: sequelize_1.DataTypes.STRING, allowNull: false, unique: true },
    customerId: {
        type: sequelize_1.DataTypes.INTEGER, allowNull: false,
        references: { model: customer_model_1.default, key: 'id' }
    },
    totalAmount: { type: sequelize_1.DataTypes.FLOAT, allowNull: false },
    discountAmount: { type: sequelize_1.DataTypes.FLOAT, allowNull: false, defaultValue: 0 },
    netAmount: { type: sequelize_1.DataTypes.FLOAT, allowNull: false },
    paidAmount: { type: sequelize_1.DataTypes.FLOAT, allowNull: false, defaultValue: 0 },
    paymentMode: {
        type: sequelize_1.DataTypes.STRING, allowNull: false, defaultValue: 'rokh'
        // Values: 'rokh', 'udhari', 'partial', 'upi', 'bank_transfer'
    },
    status: {
        type: sequelize_1.DataTypes.STRING, allowNull: false, defaultValue: 'paid'
        // Values: 'paid', 'partial', 'unpaid', 'cancelled', 'online_pending', 'online_rejected'
    },
    notes: { type: sequelize_1.DataTypes.TEXT, allowNull: true },
    billedBy: { type: sequelize_1.DataTypes.STRING, allowNull: false, defaultValue: 'Admin' }
}, {
    sequelize: database_1.default,
    modelName: 'Invoice',
    tableName: 'invoices',
    timestamps: true,
    updatedAt: false // Invoices are immutable
});
// Associations
customer_model_1.default.hasMany(Invoice, { foreignKey: 'customerId', as: 'invoices' });
Invoice.belongsTo(customer_model_1.default, { foreignKey: 'customerId', as: 'customer' });
exports.default = Invoice;
