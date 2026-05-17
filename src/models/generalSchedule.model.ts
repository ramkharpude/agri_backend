import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

class GeneralSchedule extends Model {
    public id!: number;
    public cropName!: string;
    public variety!: string;
    public userId!: number;
}

GeneralSchedule.init({
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    cropName: { type: DataTypes.STRING, allowNull: false },
    variety: { type: DataTypes.STRING, allowNull: false },
    userId: { type: DataTypes.INTEGER, allowNull: true } // Nullable for backwards compatibility with existing templates
}, {
    sequelize,
    modelName: 'GeneralSchedule',
    tableName: 'general_schedules',
    timestamps: true
});

export default GeneralSchedule;
