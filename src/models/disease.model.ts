import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';
import User from './user.model';
import Plot from './plot.model';

class Disease extends Model {
    public id!: number;
    public userId!: number;
    public plotId!: number | null;
    public title!: string;
    public description!: string;
    public images!: string; // JSON string
    public status!: string;
    public solution!: string | null;
    public consultantName!: string | null;
}

Disease.init({
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: User, key: 'id' }
    },
    plotId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: Plot, key: 'id' }
    },
    title: { type: DataTypes.STRING, allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: false },
    images: {
        type: DataTypes.TEXT,
        defaultValue: '[]',
        get() {
            const rawValue = this.getDataValue('images');
            return rawValue ? JSON.parse(rawValue) : [];
        },
        set(value: string[]) {
            this.setDataValue('images', JSON.stringify(value));
        }
    },
    status: { type: DataTypes.STRING, defaultValue: 'pending' },
    solution: { type: DataTypes.TEXT, allowNull: true },
    consultantName: { type: DataTypes.STRING, allowNull: true }
}, {
    sequelize,
    modelName: 'Disease',
    tableName: 'diseases',
    timestamps: true
});

Disease.belongsTo(User, { foreignKey: 'userId', as: 'user' });
Disease.belongsTo(Plot, { foreignKey: 'plotId', as: 'plot' });

export default Disease;
