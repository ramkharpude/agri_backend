import sequelize from '../config/database';
import '../models/user.model';
import '../models/plot.model';
import '../models/disease.model';
import '../models/consultation.model';
import '../models/schedule.model';
import '../models/notification.model';
// Import other models if needed

const syncDb = async () => {
    try {
        await sequelize.authenticate();
        // console.log('Database connected.');
        await sequelize.sync({ alter: true });
        // console.log('Database schema synced (alter: true).');
        process.exit(0);
    } catch (error) {
        console.error('Error syncing database:', error);
        process.exit(1);
    }
};

syncDb();
