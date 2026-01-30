import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

class BroadcastLog extends Model {
    public id!: number;
    public title!: string;
    public message!: string;
    public sentCount!: number;
}

BroadcastLog.init({
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    title: { type: DataTypes.STRING, allowNull: false },
    message: { type: DataTypes.TEXT, allowNull: false },
    sentCount: { type: DataTypes.INTEGER, defaultValue: 0 }
}, {
    sequelize,
    modelName: 'BroadcastLog',
    tableName: 'broadcast_logs',
    timestamps: true
});

export default BroadcastLog;
