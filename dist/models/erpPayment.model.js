"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const database_1 = __importDefault(require("../config/database"));
const customer_model_1 = __importDefault(require("./customer.model"));
const invoice_model_1 = __importDefault(require("./invoice.model"));
class ErpPayment extends sequelize_1.Model {
}
ErpPayment.init({
    id: { type: sequelize_1.DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    customerId: {
        type: sequelize_1.DataTypes.INTEGER, allowNull: false,
        references: { model: customer_model_1.default, key: 'id' }
    },
    invoiceId: {
        type: sequelize_1.DataTypes.INTEGER, allowNull: true,
        references: { model: invoice_model_1.default, key: 'id' }
    },
    amount: { type: sequelize_1.DataTypes.FLOAT, allowNull: false },
    paymentMode: {
        type: sequelize_1.DataTypes.STRING, allowNull: false, defaultValue: 'cash'
        // Values: 'cash', 'upi', 'bank_transfer'
    },
    receiptNumber: { type: sequelize_1.DataTypes.STRING, allowNull: false, unique: true },
    notes: { type: sequelize_1.DataTypes.TEXT, allowNull: true },
    collectedBy: { type: sequelize_1.DataTypes.STRING, allowNull: false, defaultValue: 'Admin' }
}, {
    sequelize: database_1.default,
    modelName: 'ErpPayment',
    tableName: 'erp_payments',
    timestamps: true,
    updatedAt: false
});
// Associations
customer_model_1.default.hasMany(ErpPayment, { foreignKey: 'customerId', as: 'payments' });
ErpPayment.belongsTo(customer_model_1.default, { foreignKey: 'customerId', as: 'customer' });
ErpPayment.belongsTo(invoice_model_1.default, { foreignKey: 'invoiceId', as: 'invoice' });
exports.default = ErpPayment;
