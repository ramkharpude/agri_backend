"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const database_1 = __importDefault(require("../config/database"));
const user_model_1 = __importDefault(require("./user.model"));
const plot_model_1 = __importDefault(require("./plot.model"));
class PlotAssignment extends sequelize_1.Model {
}
PlotAssignment.init({
    id: {
        type: sequelize_1.DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    consultantId: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        references: { model: user_model_1.default, key: 'id' }
    },
    plotId: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        references: { model: plot_model_1.default, key: 'id' }
    }
}, {
    sequelize: database_1.default,
    modelName: 'PlotAssignment',
    tableName: 'plot_assignments',
    timestamps: true
});
// Relationships
user_model_1.default.hasMany(PlotAssignment, { foreignKey: 'consultantId', as: 'assignments' });
PlotAssignment.belongsTo(user_model_1.default, { foreignKey: 'consultantId', as: 'consultant' });
plot_model_1.default.hasMany(PlotAssignment, { foreignKey: 'plotId', as: 'assignments' });
PlotAssignment.belongsTo(plot_model_1.default, { foreignKey: 'plotId', as: 'plot' });
exports.default = PlotAssignment;
