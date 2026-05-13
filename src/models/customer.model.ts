import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

class Customer extends Model {
    public id!: number;
    public userId!: number | null; // Link to app user (if registered)
    public name!: string;
    public phoneNumber!: string;
    public address!: string;
    public gstNumber!: string | null;
    public outstandingAmount!: number;
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}

Customer.init({
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    userId: { type: DataTypes.INTEGER, allowNull: true, defaultValue: null },
    name: { type: DataTypes.STRING, allowNull: false },
    phoneNumber: { type: DataTypes.STRING, allowNull: false, unique: true },
    address: { type: DataTypes.TEXT, allowNull: true, defaultValue: '' },
    gstNumber: { type: DataTypes.STRING, allowNull: true },
    outstandingAmount: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 0 }
}, {
    sequelize,
    modelName: 'Customer',
    tableName: 'customers',
    timestamps: true
});

export default Customer;
