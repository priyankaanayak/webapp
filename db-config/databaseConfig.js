const mysql = require('mysql');
require('dotenv').config();
const connection = mysql.createConnection({
    host: process.env.MYSQL_HOST,
    user : process.env.MYSQL_USERNAME,
    password: process.env.MYSQL_ROOT_PASSWORD,
    database: process.env.MYSQL_DATABASE
  });

module.exports = connection;
