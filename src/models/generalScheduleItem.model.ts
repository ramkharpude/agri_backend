import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';
import GeneralSchedule from './generalSchedule.model';

class GeneralScheduleItem extends Model {
    public id!: number;
    public generalScheduleId!: number;
    public title!: string;
    public description!: string;
    public dayNumber!: number;
    public stageImages!: string[];
    public productImages!: string[];
}

GeneralScheduleItem.init({
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    generalScheduleId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: GeneralSchedule, key: 'id' },
        onDelete: 'CASCADE'
    },
    title: { type: DataTypes.STRING, allowNull: false },
    description: { type: DataTypes.STRING, allowNull: false },
    dayNumber: { type: DataTypes.INTEGER, allowNull: false },
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
    modelName: 'GeneralScheduleItem',
    tableName: 'general_schedule_items',
    timestamps: true
});

GeneralScheduleItem.belongsTo(GeneralSchedule, { foreignKey: 'generalScheduleId' });
GeneralSchedule.hasMany(GeneralScheduleItem, { foreignKey: 'generalScheduleId', as: 'items' });

export default GeneralScheduleItem;
