"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const database_1 = __importDefault(require("../config/database"));
const user_model_1 = __importDefault(require("./user.model"));
const consultation_model_1 = __importDefault(require("./consultation.model"));
class Message extends sequelize_1.Model {
}
Message.init({
    id: {
        type: sequelize_1.DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    consultationId: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        references: { model: consultation_model_1.default, key: 'id' }
    },
    senderId: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        references: { model: user_model_1.default, key: 'id' }
    },
    content: { type: sequelize_1.DataTypes.STRING, allowNull: false },
    type: { type: sequelize_1.DataTypes.STRING, defaultValue: 'text' }
}, {
    sequelize: database_1.default,
    modelName: 'Message',
    tableName: 'messages',
    timestamps: true
});
Message.belongsTo(user_model_1.default, { as: 'sender', foreignKey: 'senderId' });
Message.belongsTo(consultation_model_1.default, { foreignKey: 'consultationId' });
exports.default = Message;
