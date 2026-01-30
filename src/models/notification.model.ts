import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';
import User from './user.model';

class Notification extends Model {
    public id!: number;
    public userId!: number;
    public title!: string;
    public message!: string;
    public type!: string;
    public relatedId!: string;
    public isRead!: boolean;
}

Notification.init({
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
    title: { type: DataTypes.STRING, allowNull: false },
    message: { type: DataTypes.STRING, allowNull: false },
    type: { type: DataTypes.STRING, allowNull: false },
    relatedId: { type: DataTypes.STRING, allowNull: true },
    isRead: { type: DataTypes.BOOLEAN, defaultValue: false }
}, {
    sequelize,
    modelName: 'Notification',
    tableName: 'notifications',
    timestamps: true
});

Notification.belongsTo(User, { foreignKey: 'userId' });

export default Notification;
