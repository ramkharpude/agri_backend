const { Sequelize } = require('sequelize');

async function testConnection(url) {
    const sequelize = new Sequelize(url, {
        dialect: 'postgres',
        protocol: 'postgres',
        dialectOptions: {
            ssl: {
                require: true,
                rejectUnauthorized: false
            }
        },
        logging: false
    });

    try {
        await sequelize.authenticate();
        console.log('Connection has been established successfully to: ' + url);
        process.exit(0);
    } catch (error) {
        console.error('Unable to connect to the database with url: ' + url, error.message);
    }
}

async function main() {
    const url1 = "postgresql://postgres.bfblosgvllopdwatvejm:Agriconsaltant@aws-1-ap-south-1.pooler.supabase.com:6543/postgres";
    const url2 = "postgresql://postgres:Agriconsaltant@db.bfblosgvllopdwatvejm.supabase.co:5432/postgres";
    const url3 = "postgresql://postgres.bfblosgvllopdwatvejm:Agriconsaltant@aws-0-ap-south-1.pooler.supabase.com:6543/postgres";

    await testConnection(url1);
    await testConnection(url2);
    await testConnection(url3);
    process.exit(1);
}

main();
