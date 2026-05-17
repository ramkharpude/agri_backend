"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const database_1 = __importDefault(require("../config/database"));
const user_model_1 = __importDefault(require("./user.model"));
const plot_model_1 = __importDefault(require("./plot.model"));
class Disease extends sequelize_1.Model {
}
Disease.init({
    id: {
        type: sequelize_1.DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    userId: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        references: { model: user_model_1.default, key: 'id' }
    },
    plotId: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: true,
        references: { model: plot_model_1.default, key: 'id' }
    },
    title: { type: sequelize_1.DataTypes.STRING, allowNull: false },
    description: { type: sequelize_1.DataTypes.TEXT, allowNull: false },
    images: {
        type: sequelize_1.DataTypes.TEXT,
        defaultValue: '[]',
        get() {
            const rawValue = this.getDataValue('images');
            return rawValue ? JSON.parse(rawValue) : [];
        },
        set(value) {
            this.setDataValue('images', JSON.stringify(value));
        }
    },
    status: { type: sequelize_1.DataTypes.STRING, defaultValue: 'pending' },
    solution: { type: sequelize_1.DataTypes.TEXT, allowNull: true },
    consultantName: { type: sequelize_1.DataTypes.STRING, allowNull: true },
    suggestedProducts: { type: sequelize_1.DataTypes.JSON, allowNull: true }
}, {
    sequelize: database_1.default,
    modelName: 'Disease',
    tableName: 'diseases',
    timestamps: true
});
Disease.belongsTo(user_model_1.default, { foreignKey: 'userId', as: 'user' });
Disease.belongsTo(plot_model_1.default, { foreignKey: 'plotId', as: 'plot' });
exports.default = Disease;
