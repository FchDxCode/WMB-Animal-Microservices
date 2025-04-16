// config/db.js

import { Sequelize } from 'sequelize';
import { config } from 'dotenv';

config();

const sequelize = new Sequelize({
  dialect: 'mysql',
  host: process.env.DB_HOST,
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 3306,
});

(async () => {
  try {
    await sequelize.authenticate();
    console.log('Connected to MySQL database via Sequelize.');
  } catch (err) {
    console.error('Database connection failed:', err);
  }
})();

export default sequelize;