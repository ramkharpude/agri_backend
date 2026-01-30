import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

class User extends Model {
    public id!: number;
    public phoneNumber!: string;
    public fullName!: string;
    public address!: string;
    public role!: string;
    public isVerified!: boolean;
    public pushToken!: string | null;

}

User.init({
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    phoneNumber: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },

    fullName: {
        type: DataTypes.STRING,
        allowNull: false
    },
    address: {
        type: DataTypes.STRING,
        allowNull: false
    },
    role: {
        type: DataTypes.STRING,
        defaultValue: 'farmer'
    },
    isVerified: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    pushToken: {
        type: DataTypes.STRING,
        allowNull: true
    }
}, {
    sequelize,
    modelName: 'User',
    tableName: 'users',
    timestamps: true
});

export default User;
