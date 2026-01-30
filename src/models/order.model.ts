import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';
import User from './user.model';

class Order extends Model {
    public id!: number;
    public userId!: number;
    public items!: any; // JSON array of products with quantity
    public shippingAddress!: any; // JSON address object
    public totalAmount!: number;
    public status!: string; // 'pending', 'packed', 'shipped', 'in_transit', 'delivered', 'cancelled'
    public paymentMethod!: string;
    public paymentStatus!: string;
}

Order.init({
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: User,
            key: 'id'
        }
    },
    items: {
        type: DataTypes.JSON, // Use JSON for SQLite
        allowNull: false,
    },
    shippingAddress: {
        type: DataTypes.JSON,
        allowNull: false,
    },
    totalAmount: {
        type: DataTypes.FLOAT,
        allowNull: false,
    },
    status: {
        type: DataTypes.ENUM('pending', 'packed', 'shipped', 'in_transit', 'delivered', 'cancelled'),
        defaultValue: 'pending'
    },
    paymentMethod: {
        type: DataTypes.STRING,
        defaultValue: 'UPI'
    },
    paymentStatus: {
        type: DataTypes.ENUM('pending', 'paid', 'failed'),
        defaultValue: 'pending'
    }
}, {
    sequelize,
    tableName: 'orders',
    timestamps: true
});

// Define Association
User.hasMany(Order, { foreignKey: 'userId' });
Order.belongsTo(User, { foreignKey: 'userId' });

export default Order;
