"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const database_1 = __importDefault(require("../config/database"));
const customer_model_1 = __importDefault(require("./customer.model"));
const invoice_model_1 = __importDefault(require("./invoice.model"));
class LedgerEntry extends sequelize_1.Model {
}
LedgerEntry.init({
    id: { type: sequelize_1.DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    customerId: {
        type: sequelize_1.DataTypes.INTEGER, allowNull: false,
        references: { model: customer_model_1.default, key: 'id' }
    },
    invoiceId: {
        type: sequelize_1.DataTypes.INTEGER, allowNull: true,
        references: { model: invoice_model_1.default, key: 'id' }
    },
    type: {
        type: sequelize_1.DataTypes.STRING, allowNull: false
        // Values: 'sale', 'payment', 'adjustment'
    },
    debit: { type: sequelize_1.DataTypes.FLOAT, allowNull: false, defaultValue: 0 }, // Amount owed (sale)
    credit: { type: sequelize_1.DataTypes.FLOAT, allowNull: false, defaultValue: 0 }, // Amount paid (payment)
    balance: { type: sequelize_1.DataTypes.FLOAT, allowNull: false }, // Running balance
    description: { type: sequelize_1.DataTypes.TEXT, allowNull: false }
}, {
    sequelize: database_1.default,
    modelName: 'LedgerEntry',
    tableName: 'ledger_entries',
    timestamps: true,
    updatedAt: false // Ledger entries are immutable
});
// Associations
customer_model_1.default.hasMany(LedgerEntry, { foreignKey: 'customerId', as: 'ledgerEntries' });
LedgerEntry.belongsTo(customer_model_1.default, { foreignKey: 'customerId', as: 'customer' });
LedgerEntry.belongsTo(invoice_model_1.default, { foreignKey: 'invoiceId', as: 'invoice' });
exports.default = LedgerEntry;
