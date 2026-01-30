import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';
import Plot from './plot.model';

class Schedule extends Model {
    public id!: number;
    public plotId!: number;
    public title!: string;
    public description!: string;
    public dayNumber!: number;
    public status!: 'upcoming' | 'completed';
}

Schedule.init({
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    plotId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: Plot, key: 'id' }
    },
    title: { type: DataTypes.STRING, allowNull: false },
    description: { type: DataTypes.STRING, allowNull: false },
    dayNumber: { type: DataTypes.INTEGER, allowNull: false },
    status: {
        type: DataTypes.ENUM('upcoming', 'completed'),
        defaultValue: 'upcoming'
    }
}, {
    sequelize,
    modelName: 'Schedule',
    tableName: 'schedules',
    timestamps: true
});

Schedule.belongsTo(Plot, { foreignKey: 'plotId' });

export default Schedule;
