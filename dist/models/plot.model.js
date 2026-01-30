"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const database_1 = __importDefault(require("../config/database"));
const user_model_1 = __importDefault(require("./user.model"));
class Plot extends sequelize_1.Model {
}
Plot.init({
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
    name: { type: sequelize_1.DataTypes.STRING, allowNull: false },
    season: { type: sequelize_1.DataTypes.STRING, allowNull: false },
    crop: { type: sequelize_1.DataTypes.STRING, allowNull: false },
    variety: { type: sequelize_1.DataTypes.STRING, allowNull: false },
    sowingDate: { type: sequelize_1.DataTypes.DATE, allowNull: false },
    soilType: { type: sequelize_1.DataTypes.STRING, allowNull: false },
    area: { type: sequelize_1.DataTypes.FLOAT, allowNull: false },
    length: { type: sequelize_1.DataTypes.FLOAT, allowNull: true },
    width: { type: sequelize_1.DataTypes.FLOAT, allowNull: true },
    numberOfPlants: { type: sequelize_1.DataTypes.INTEGER, allowNull: true },
    village: { type: sequelize_1.DataTypes.STRING, allowNull: false },
    taluka: { type: sequelize_1.DataTypes.STRING, allowNull: false },
    district: { type: sequelize_1.DataTypes.STRING, allowNull: false },
    status: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
        defaultValue: 'active',
        validate: {
            isIn: [['active', 'completed']]
        }
    }
}, {
    sequelize: database_1.default,
    modelName: 'Plot',
    tableName: 'plots',
    timestamps: true
});
// Relationships
user_model_1.default.hasMany(Plot, { foreignKey: 'userId' });
Plot.belongsTo(user_model_1.default, { foreignKey: 'userId', as: 'user' });
exports.default = Plot;
