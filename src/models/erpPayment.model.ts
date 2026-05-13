import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';
import Customer from './customer.model';
import Invoice from './invoice.model';

class ErpPayment extends Model {
    public id!: number;
    public customerId!: number;
    public invoiceId!: number | null;
    public amount!: number;
    public paymentMode!: string;
    public receiptNumber!: string;
    public notes!: string | null;
    public collectedBy!: string;
    public readonly createdAt!: Date;
}

ErpPayment.init({
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    customerId: {
        type: DataTypes.INTEGER, allowNull: false,
        references: { model: Customer, key: 'id' }
    },
    invoiceId: {
        type: DataTypes.INTEGER, allowNull: true,
        references: { model: Invoice, key: 'id' }
    },
    amount: { type: DataTypes.FLOAT, allowNull: false },
    paymentMode: {
        type: DataTypes.STRING, allowNull: false, defaultValue: 'cash'
        // Values: 'cash', 'upi', 'bank_transfer'
    },
    receiptNumber: { type: DataTypes.STRING, allowNull: false, unique: true },
    notes: { type: DataTypes.TEXT, allowNull: true },
    collectedBy: { type: DataTypes.STRING, allowNull: false, defaultValue: 'Admin' }
}, {
    sequelize,
    modelName: 'ErpPayment',
    tableName: 'erp_payments',
    timestamps: true,
    updatedAt: false
});

// Associations
Customer.hasMany(ErpPayment, { foreignKey: 'customerId', as: 'payments' });
ErpPayment.belongsTo(Customer, { foreignKey: 'customerId', as: 'customer' });
ErpPayment.belongsTo(Invoice, { foreignKey: 'invoiceId', as: 'invoice' });

export default ErpPayment;
