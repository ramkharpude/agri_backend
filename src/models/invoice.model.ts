import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';
import Customer from './customer.model';

class Invoice extends Model {
    public id!: number;
    public invoiceNumber!: string;
    public customerId!: number;
    public totalAmount!: number;
    public discountAmount!: number;
    public netAmount!: number;
    public paidAmount!: number;
    public paymentMode!: string;
    public status!: string;
    public notes!: string | null;
    public billedBy!: string;
    public readonly createdAt!: Date;
}

Invoice.init({
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    invoiceNumber: { type: DataTypes.STRING, allowNull: false, unique: true },
    customerId: {
        type: DataTypes.INTEGER, allowNull: false,
        references: { model: Customer, key: 'id' }
    },
    totalAmount: { type: DataTypes.FLOAT, allowNull: false },
    discountAmount: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 0 },
    netAmount: { type: DataTypes.FLOAT, allowNull: false },
    paidAmount: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 0 },
    paymentMode: {
        type: DataTypes.STRING, allowNull: false, defaultValue: 'rokh'
        // Values: 'rokh', 'udhari', 'partial', 'upi', 'bank_transfer'
    },
    status: {
        type: DataTypes.STRING, allowNull: false, defaultValue: 'paid'
        // Values: 'paid', 'partial', 'unpaid', 'cancelled', 'online_pending', 'online_rejected'
    },
    notes: { type: DataTypes.TEXT, allowNull: true },
    billedBy: { type: DataTypes.STRING, allowNull: false, defaultValue: 'Admin' }
}, {
    sequelize,
    modelName: 'Invoice',
    tableName: 'invoices',
    timestamps: true,
    updatedAt: false // Invoices are immutable
});

// Associations
Customer.hasMany(Invoice, { foreignKey: 'customerId', as: 'invoices' });
Invoice.belongsTo(Customer, { foreignKey: 'customerId', as: 'customer' });

export default Invoice;
