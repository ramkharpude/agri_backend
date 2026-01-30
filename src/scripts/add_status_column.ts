import sequelize from '../config/database';

const addColumn = async () => {
    try {
        await sequelize.query("ALTER TABLE schedules ADD COLUMN status TEXT DEFAULT 'upcoming'");
        // console.log("Column 'status' added successfully.");
    } catch (error: any) {
        if (error.message && error.message.includes('duplicate column name')) {
            // console.log("Column 'status' already exists.");
        } else {
            console.error("Error adding column:", error);
        }
    } finally {
        await sequelize.close();
    }
};

addColumn();
