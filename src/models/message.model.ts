import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';
import User from './user.model';
import Consultation from './consultation.model';

class Message extends Model {
    public id!: number;
    public consultationId!: number;
    public senderId!: number;
    public content!: string;
    public type!: string;
}

Message.init({
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    consultationId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: Consultation, key: 'id' }
    },
    senderId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: User, key: 'id' }
    },
    content: { type: DataTypes.STRING, allowNull: false },
    type: { type: DataTypes.STRING, defaultValue: 'text' }
}, {
    sequelize,
    modelName: 'Message',
    tableName: 'messages',
    timestamps: true
});

Message.belongsTo(User, { as: 'sender', foreignKey: 'senderId' });
Message.belongsTo(Consultation, { foreignKey: 'consultationId' });

export default Message;
