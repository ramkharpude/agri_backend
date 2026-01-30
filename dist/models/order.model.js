"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const database_1 = __importDefault(require("../config/database"));
const user_model_1 = __importDefault(require("./user.model"));
class Order extends sequelize_1.Model {
}
Order.init({
    id: {
        type: sequelize_1.DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    userId: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: user_model_1.default,
            key: 'id'
        }
    },
    items: {
        type: sequelize_1.DataTypes.JSON, // Use JSON for SQLite
        allowNull: false,
    },
    shippingAddress: {
        type: sequelize_1.DataTypes.JSON,
        allowNull: false,
    },
    totalAmount: {
        type: sequelize_1.DataTypes.FLOAT,
        allowNull: false,
    },
    status: {
        type: sequelize_1.DataTypes.ENUM('pending', 'packed', 'shipped', 'in_transit', 'delivered', 'cancelled'),
        defaultValue: 'pending'
    },
    paymentMethod: {
        type: sequelize_1.DataTypes.STRING,
        defaultValue: 'UPI'
    },
    paymentStatus: {
        type: sequelize_1.DataTypes.ENUM('pending', 'paid', 'failed'),
        defaultValue: 'pending'
    }
}, {
    sequelize: database_1.default,
    tableName: 'orders',
    timestamps: true
});
// Define Association
user_model_1.default.hasMany(Order, { foreignKey: 'userId' });
Order.belongsTo(user_model_1.default, { foreignKey: 'userId' });
exports.default = Order;
