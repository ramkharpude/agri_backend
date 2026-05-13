import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';
import Customer from './customer.model';
import Invoice from './invoice.model';

class LedgerEntry extends Model {
    public id!: number;
    public customerId!: number;
    public invoiceId!: number | null;
    public type!: string;
    public debit!: number;
    public credit!: number;
    public balance!: number;
    public description!: string;
    public readonly createdAt!: Date;
}

LedgerEntry.init({
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    customerId: {
        type: DataTypes.INTEGER, allowNull: false,
        references: { model: Customer, key: 'id' }
    },
    invoiceId: {
        type: DataTypes.INTEGER, allowNull: true,
        references: { model: Invoice, key: 'id' }
    },
    type: {
        type: DataTypes.STRING, allowNull: false
        // Values: 'sale', 'payment', 'adjustment'
    },
    debit: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 0 },   // Amount owed (sale)
    credit: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 0 },   // Amount paid (payment)
    balance: { type: DataTypes.FLOAT, allowNull: false },                    // Running balance
    description: { type: DataTypes.TEXT, allowNull: false }
}, {
    sequelize,
    modelName: 'LedgerEntry',
    tableName: 'ledger_entries',
    timestamps: true,
    updatedAt: false // Ledger entries are immutable
});

// Associations
Customer.hasMany(LedgerEntry, { foreignKey: 'customerId', as: 'ledgerEntries' });
LedgerEntry.belongsTo(Customer, { foreignKey: 'customerId', as: 'customer' });
LedgerEntry.belongsTo(Invoice, { foreignKey: 'invoiceId', as: 'invoice' });

export default LedgerEntry;
