import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';
import Achievement from './achievement.model';
import User from './user.model';

class AchievementComment extends Model {
    public id!: number;
    public achievementId!: number;
    public userId!: number;
    public userName!: string;
    public text!: string;
    public readonly createdAt!: Date;
}

AchievementComment.init({
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    achievementId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: Achievement, key: 'id' }
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: User, key: 'id' }
    },
    userName: { type: DataTypes.STRING, allowNull: false },
    text: { type: DataTypes.TEXT, allowNull: false }
}, {
    sequelize,
    modelName: 'AchievementComment',
    tableName: 'achievement_comments',
    timestamps: true,
    updatedAt: false
});

Achievement.hasMany(AchievementComment, { foreignKey: 'achievementId', as: 'comments' });
AchievementComment.belongsTo(Achievement, { foreignKey: 'achievementId' });

export default AchievementComment;
