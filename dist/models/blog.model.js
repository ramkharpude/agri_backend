"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const database_1 = __importDefault(require("../config/database"));
class Blog extends sequelize_1.Model {
}
Blog.init({
    id: {
        type: sequelize_1.DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    title: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false
    },
    description: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: false
    },
    author: {
        type: sequelize_1.DataTypes.STRING,
        defaultValue: 'Admin'
    },
    images: {
        type: sequelize_1.DataTypes.JSON, // Stores array of strings
        allowNull: true
    },
    isPublished: {
        type: sequelize_1.DataTypes.BOOLEAN,
        defaultValue: true
    },
    likes: {
        type: sequelize_1.DataTypes.INTEGER,
        defaultValue: 0
    },
    likedBy: {
        type: sequelize_1.DataTypes.JSON,
        defaultValue: []
    }
}, {
    sequelize: database_1.default,
    tableName: 'blogs',
    timestamps: true
});
exports.default = Blog;
