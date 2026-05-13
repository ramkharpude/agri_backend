import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

class Achievement extends Model {
    public id!: number;
    public title!: string;
    public description!: string;
    public photos!: string[];
    public likedBy!: number[];
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}

Achievement.init({
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    title: { type: DataTypes.STRING, allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: false },
    photos: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: []
    },
    likedBy: {
        type: DataTypes.JSON,
        allowNull: false,
        defaultValue: []
    }
}, {
    sequelize,
    modelName: 'Achievement',
    tableName: 'achievements',
    timestamps: true
});

export default Achievement;
