import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';
import User from './user.model';

class Plot extends Model {
    public id!: number;
    public userId!: number;
    public name!: string;
    public season!: string;
    public crop!: string;
    public variety!: string;
    public sowingDate!: Date;
    public soilType!: string;
    public area!: number;
    public length!: number;
    public width!: number;
    public numberOfPlants!: number;
    public village!: string;
    public taluka!: string;
    public district!: string;
    public status!: string;
}

Plot.init({
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: User,
            key: 'id'
        }
    },
    name: { type: DataTypes.STRING, allowNull: false },
    season: { type: DataTypes.STRING, allowNull: false },
    crop: { type: DataTypes.STRING, allowNull: false },
    variety: { type: DataTypes.STRING, allowNull: false },
    sowingDate: { type: DataTypes.DATE, allowNull: false },
    soilType: { type: DataTypes.STRING, allowNull: false },
    area: { type: DataTypes.FLOAT, allowNull: false },
    length: { type: DataTypes.FLOAT, allowNull: true },
    width: { type: DataTypes.FLOAT, allowNull: true },
    numberOfPlants: { type: DataTypes.INTEGER, allowNull: true },
    village: { type: DataTypes.STRING, allowNull: false },
    taluka: { type: DataTypes.STRING, allowNull: false },
    district: { type: DataTypes.STRING, allowNull: false },
    status: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'active',
        validate: {
            isIn: [['active', 'completed']]
        }
    }
}, {
    sequelize,
    modelName: 'Plot',
    tableName: 'plots',
    timestamps: true
});

// Relationships
User.hasMany(Plot, { foreignKey: 'userId' });
Plot.belongsTo(User, { foreignKey: 'userId', as: 'user' });

export default Plot;
