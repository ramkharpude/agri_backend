import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';
import User from './user.model';
import Plot from './plot.model';

class PlotAssignment extends Model {
    public id!: number;
    public consultantId!: number;
    public plotId!: number;
    public readonly createdAt!: Date;
}

PlotAssignment.init({
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    consultantId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: User, key: 'id' }
    },
    plotId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: Plot, key: 'id' }
    }
}, {
    sequelize,
    modelName: 'PlotAssignment',
    tableName: 'plot_assignments',
    timestamps: true
});

// Relationships
User.hasMany(PlotAssignment, { foreignKey: 'consultantId', as: 'assignments' });
PlotAssignment.belongsTo(User, { foreignKey: 'consultantId', as: 'consultant' });
Plot.hasMany(PlotAssignment, { foreignKey: 'plotId', as: 'assignments' });
PlotAssignment.belongsTo(Plot, { foreignKey: 'plotId', as: 'plot' });

export default PlotAssignment;
