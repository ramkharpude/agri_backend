import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';
import User from './user.model';

class AgriMarket extends Model {
    public id!: number;
    public userId!: number;
    public farmerName!: string;
    public contactNo!: string;
    public fullAddress!: string;
    public cropName!: string;
    public variety!: string;
    public areaInAcres!: number;
    public category!: string;
    public photos!: string[]; // Array of URLs
    public status!: string;
    public soldAt!: Date | null;
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}

AgriMarket.init({
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: User,
            key: 'id'
        }
    },
    farmerName: { type: DataTypes.STRING, allowNull: false },
    contactNo: { type: DataTypes.STRING, allowNull: false },
    fullAddress: { type: DataTypes.TEXT, allowNull: false },
    cropName: { type: DataTypes.STRING, allowNull: false },
    variety: { type: DataTypes.STRING, allowNull: false },
    areaInAcres: { type: DataTypes.FLOAT, allowNull: false },
    category: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            isIn: [['Fruit', 'Dry Fruit', 'Vegetable', 'Pulses', 'Other']]
        }
    },
    photos: {
        type: DataTypes.TEXT,
        allowNull: false,
        defaultValue: '[]',
        get() {
            const rawValue = this.getDataValue('photos');
            return rawValue ? JSON.parse(rawValue) : [];
        },
        set(value: string[]) {
            this.setDataValue('photos', JSON.stringify(value));
        }
    },
    status: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'available',
        validate: {
            isIn: [['available', 'sold']]
        }
    },
    soldAt: {
        type: DataTypes.DATE,
        allowNull: true
    }
}, {
    sequelize,
    modelName: 'AgriMarket',
    tableName: 'agri_market_listings',
    timestamps: true
});

// Relationships
User.hasMany(AgriMarket, { foreignKey: 'userId' });
AgriMarket.belongsTo(User, { foreignKey: 'userId', as: 'user' });

export default AgriMarket;
