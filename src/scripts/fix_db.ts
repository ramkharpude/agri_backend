import sequelize from '../config/database';

const addLikesColumn = async () => {
    try {
        await sequelize.authenticate();
        // console.log('Database connected.');

        // Raw SQL to add column if it doesn't exist
        // Note: SQLite does not support IF NOT EXISTS for ADD COLUMN directly in standard SQL, 
        // but it usually errors safely or we catch it.
        // However, duplicate column error is harmless if we catch it.

        try {
            await sequelize.query('ALTER TABLE blogs ADD COLUMN likes INTEGER DEFAULT 0;');
            // console.log('Successfully added "likes" column to "blogs" table.');
        } catch (error: any) {
            if (error.message && error.message.includes('duplicate column name')) {
                // console.log('"likes" column already exists.');
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

addLikesColumn();
