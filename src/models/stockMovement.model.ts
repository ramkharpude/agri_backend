import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';
import Product from './product.model';

class StockMovement extends Model {
    public id!: number;
    public productId!: number;
    public type!: string;
    public quantity!: number;
    public previousStock!: number;
    public newStock!: number;
    public referenceId!: string | null;
    public notes!: string | null;
    public readonly createdAt!: Date;
}

StockMovement.init({
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    productId: {
        type: DataTypes.INTEGER, allowNull: false,
        references: { model: Product, key: 'id' }
    },
    type: {
        type: DataTypes.STRING, allowNull: false
        // Values: 'sale', 'purchase', 'adjustment', 'return'
    },
    quantity: { type: DataTypes.FLOAT, allowNull: false }, // Positive = stock in, Negative = stock out
    previousStock: { type: DataTypes.FLOAT, allowNull: false },
    newStock: { type: DataTypes.FLOAT, allowNull: false },
    referenceId: { type: DataTypes.STRING, allowNull: true }, // Invoice number, etc.
    notes: { type: DataTypes.TEXT, allowNull: true }
}, {
    sequelize,
    modelName: 'StockMovement',
    tableName: 'stock_movements',
    timestamps: true,
    updatedAt: false
});

// Associations
Product.hasMany(StockMovement, { foreignKey: 'productId', as: 'stockMovements' });
StockMovement.belongsTo(Product, { foreignKey: 'productId', as: 'product' });

export default StockMovement;
