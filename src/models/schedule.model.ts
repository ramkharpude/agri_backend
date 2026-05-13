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
    public stageImages!: string[];
    public productImages!: string[];
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
    },
    stageImages: {
        type: DataTypes.TEXT,
        allowNull: true,
        get() {
            const rawValue = this.getDataValue('stageImages');
            return rawValue ? JSON.parse(rawValue as unknown as string) : [];
        },
        set(value: string[]) {
            this.setDataValue('stageImages', JSON.stringify(value) as unknown as string[]);
        }
    },
    productImages: {
        type: DataTypes.TEXT,
        allowNull: true,
        get() {
            const rawValue = this.getDataValue('productImages');
            return rawValue ? JSON.parse(rawValue as unknown as string) : [];
        },
        set(value: string[]) {
            this.setDataValue('productImages', JSON.stringify(value) as unknown as string[]);
        }
    }
}, {
    sequelize,
    modelName: 'Schedule',
    tableName: 'schedules',
    timestamps: true
});

Schedule.belongsTo(Plot, { foreignKey: 'plotId' });

export default Schedule;
