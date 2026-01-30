import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';
import User from './user.model';

class Consultation extends Model {
    public id!: number;
    public farmerId!: number;
    public consultantId!: number;
    public scheduledAt!: Date;
    public type!: string;
    public notes!: string;
}

Consultation.init({
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    farmerId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: User, key: 'id' }
    },
    consultantId: {
        type: DataTypes.INTEGER,
        allowNull: false, // Or true if unassigned initially
        references: { model: User, key: 'id' }
    },
    scheduledAt: { type: DataTypes.DATE, allowNull: false },
    type: { type: DataTypes.STRING, allowNull: false },
    notes: { type: DataTypes.STRING, allowNull: true }
}, {
    sequelize,
    modelName: 'Consultation',
    tableName: 'consultations',
    timestamps: true
});

Consultation.belongsTo(User, { as: 'farmer', foreignKey: 'farmerId' });
Consultation.belongsTo(User, { as: 'consultant', foreignKey: 'consultantId' });

export default Consultation;
