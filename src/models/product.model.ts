import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

class Product extends Model {
    public id!: number;
    public name!: string;
    public description!: string;
    public category!: string;
    public company!: string;
    public price!: number;
    public offerPrice!: number | null;
    public offer!: string | null;
    public stock!: number;
    public image!: string; // URL or base64
    public images!: string[]; // Array of URLs or base64 strings
    // ERP Fields
    public hsn!: string | null;
    public barcode!: string | null;
    public purchasePrice!: number | null;
    public unit!: string;
    public lowStockThreshold!: number;
    public batchNumber!: string | null;
    public expiryDate!: Date | null;
}

Product.init({
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    name: { type: DataTypes.STRING, allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: false },
    category: { type: DataTypes.STRING, allowNull: false },
    company: { type: DataTypes.STRING, allowNull: false },
    price: { type: DataTypes.FLOAT, allowNull: false },
    offerPrice: { type: DataTypes.FLOAT, allowNull: true },
    offer: { type: DataTypes.STRING, allowNull: true },
    stock: { type: DataTypes.INTEGER, defaultValue: 0 },
    image: { type: DataTypes.TEXT, allowNull: true },
    images: { type: DataTypes.JSON, allowNull: true }, // Store multiple images as JSON array
    // ERP Fields
    hsn: { type: DataTypes.STRING, allowNull: true },
    barcode: { type: DataTypes.STRING, allowNull: true },
    purchasePrice: { type: DataTypes.FLOAT, allowNull: true },
    unit: { type: DataTypes.STRING, allowNull: false, defaultValue: 'piece' },
    lowStockThreshold: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 10 },
    batchNumber: { type: DataTypes.STRING, allowNull: true },
    expiryDate: { type: DataTypes.DATE, allowNull: true }
}, {
    sequelize,
    modelName: 'Product',
    tableName: 'products',
    timestamps: true
});

export default Product;

