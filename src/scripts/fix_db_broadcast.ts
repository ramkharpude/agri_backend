import sequelize from '../config/database';
import BroadcastLog from '../models/broadcastLog.model';

const fixDb = async () => {
    try {
        await sequelize.authenticate();
        // console.log('Database connected.');

        // Force sync BroadcastLog table only
        await BroadcastLog.sync({ alter: true });
        // console.log('BroadcastLog table synced.');

    } catch (error) {
        console.error('Error updating database:', error);
    } finally {
        await sequelize.close();
    }
};

fixDb();
