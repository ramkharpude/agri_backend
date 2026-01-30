"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const database_1 = __importDefault(require("../config/database"));
const user_model_1 = __importDefault(require("./user.model"));
class Consultation extends sequelize_1.Model {
}
Consultation.init({
    id: {
        type: sequelize_1.DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    farmerId: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        references: { model: user_model_1.default, key: 'id' }
    },
    consultantId: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false, // Or true if unassigned initially
        references: { model: user_model_1.default, key: 'id' }
    },
    scheduledAt: { type: sequelize_1.DataTypes.DATE, allowNull: false },
    type: { type: sequelize_1.DataTypes.STRING, allowNull: false },
    notes: { type: sequelize_1.DataTypes.STRING, allowNull: true }
}, {
    sequelize: database_1.default,
    modelName: 'Consultation',
    tableName: 'consultations',
    timestamps: true
});
Consultation.belongsTo(user_model_1.default, { as: 'farmer', foreignKey: 'farmerId' });
Consultation.belongsTo(user_model_1.default, { as: 'consultant', foreignKey: 'consultantId' });
exports.default = Consultation;
