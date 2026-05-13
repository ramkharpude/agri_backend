import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';
import Invoice from './invoice.model';
import Product from './product.model';

class InvoiceItem extends Model {
    public id!: number;
    public invoiceId!: number;
    public productId!: number;
    public productName!: string;
    public quantity!: number;
    public unit!: string;
    public rate!: number;
    public amount!: number;
}

InvoiceItem.init({
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    invoiceId: {
        type: DataTypes.INTEGER, allowNull: false,
        references: { model: Invoice, key: 'id' }
    },
    productId: {
        type: DataTypes.INTEGER, allowNull: false,
        references: { model: Product, key: 'id' }
    },
    productName: { type: DataTypes.STRING, allowNull: false },
    quantity: { type: DataTypes.FLOAT, allowNull: false },
    unit: { type: DataTypes.STRING, allowNull: false, defaultValue: 'piece' },
    rate: { type: DataTypes.FLOAT, allowNull: false },
    amount: { type: DataTypes.FLOAT, allowNull: false } // quantity × rate
}, {
    sequelize,
    modelName: 'InvoiceItem',
    tableName: 'invoice_items',
    timestamps: false
});

// Associations
Invoice.hasMany(InvoiceItem, { foreignKey: 'invoiceId', as: 'items' });
InvoiceItem.belongsTo(Invoice, { foreignKey: 'invoiceId' });
InvoiceItem.belongsTo(Product, { foreignKey: 'productId' });

export default InvoiceItem;
