"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const database_1 = __importDefault(require("../config/database"));
const achievement_model_1 = __importDefault(require("./achievement.model"));
const user_model_1 = __importDefault(require("./user.model"));
class AchievementComment extends sequelize_1.Model {
}
AchievementComment.init({
    id: { type: sequelize_1.DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    achievementId: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        references: { model: achievement_model_1.default, key: 'id' }
    },
    userId: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        references: { model: user_model_1.default, key: 'id' }
    },
    userName: { type: sequelize_1.DataTypes.STRING, allowNull: false },
    text: { type: sequelize_1.DataTypes.TEXT, allowNull: false }
}, {
    sequelize: database_1.default,
    modelName: 'AchievementComment',
    tableName: 'achievement_comments',
    timestamps: true,
    updatedAt: false
});
achievement_model_1.default.hasMany(AchievementComment, { foreignKey: 'achievementId', as: 'comments' });
AchievementComment.belongsTo(achievement_model_1.default, { foreignKey: 'achievementId' });
exports.default = AchievementComment;
