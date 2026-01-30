import { Sequelize } from 'sequelize';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const isProduction = process.env.NODE_ENV === 'production' || process.env.DATABASE_URL;

if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not defined');
}

const sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    protocol: 'postgres',
    dialectOptions: {
        ssl: {
            require: true,
            rejectUnauthorized: false
        }
    },
    timezone: '+05:30', // India Standard Time
    logging: false
});

export default sequelize;
