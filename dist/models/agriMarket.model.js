"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const database_1 = __importDefault(require("../config/database"));
const user_model_1 = __importDefault(require("./user.model"));
class AgriMarket extends sequelize_1.Model {
}
AgriMarket.init({
    id: {
        type: sequelize_1.DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    userId: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: user_model_1.default,
            key: 'id'
        }
    },
    farmerName: { type: sequelize_1.DataTypes.STRING, allowNull: false },
    contactNo: { type: sequelize_1.DataTypes.STRING, allowNull: false },
    fullAddress: { type: sequelize_1.DataTypes.TEXT, allowNull: false },
    cropName: { type: sequelize_1.DataTypes.STRING, allowNull: false },
    variety: { type: sequelize_1.DataTypes.STRING, allowNull: false },
    areaInAcres: { type: sequelize_1.DataTypes.FLOAT, allowNull: false },
    category: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
        validate: {
            isIn: [['Fruit', 'Dry Fruit', 'Vegetable', 'Pulses', 'Other']]
        }
    },
    photos: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: false,
        defaultValue: '[]',
        get() {
            const rawValue = this.getDataValue('photos');
            return rawValue ? JSON.parse(rawValue) : [];
        },
        set(value) {
            this.setDataValue('photos', JSON.stringify(value));
        }
    },
    status: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
        defaultValue: 'available',
        validate: {
            isIn: [['available', 'sold']]
        }
    },
    soldAt: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true
    },
    postedBy: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
        defaultValue: 'farmer'
    },
    agentName: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: true,
        defaultValue: null
    },
    agentContactNo: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: true,
        defaultValue: null
    }
}, {
    sequelize: database_1.default,
    modelName: 'AgriMarket',
    tableName: 'agri_market_listings',
    timestamps: true
});
// Relationships
user_model_1.default.hasMany(AgriMarket, { foreignKey: 'userId' });
AgriMarket.belongsTo(user_model_1.default, { foreignKey: 'userId', as: 'user' });
exports.default = AgriMarket;
