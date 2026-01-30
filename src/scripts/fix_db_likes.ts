import sequelize from '../config/database';

const addLikedByColumn = async () => {
    try {
        await sequelize.authenticate();
        // console.log('Database connected.');

        try {
            // Add likedBy column (JSON)
            // In SQLite, JSON is just TEXT
            await sequelize.query('ALTER TABLE blogs ADD COLUMN likedBy TEXT DEFAULT "[]";');
            // console.log('Successfully added "likedBy" column to "blogs" table.');
        } catch (error: any) {
            if (error.message && error.message.includes('duplicate column name')) {
                // console.log('"likedBy" column already exists.');
            } else {
                throw error;
            }
        }

    } catch (error) {
        console.error('Error updating database:', error);
    } finally {
        await sequelize.close();
    }
};

addLikedByColumn();
