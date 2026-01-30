import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

class Blog extends Model {
    public id!: number;
    public title!: string;
    public description!: string;
    public author!: string;
    public images!: string[]; // JSON array of image URLs
    public isPublished!: boolean;
    public likes!: number;
    public likedBy!: number[]; // Array of user IDs
}

Blog.init({
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    title: {
        type: DataTypes.STRING,
        allowNull: false
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    author: {
        type: DataTypes.STRING,
        defaultValue: 'Admin'
    },
    images: {
        type: DataTypes.JSON, // Stores array of strings
        allowNull: true
    },
    isPublished: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    likes: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    likedBy: {
        type: DataTypes.JSON,
        defaultValue: []
    }
}, {
    sequelize,
    tableName: 'blogs',
    timestamps: true
});

export default Blog;
