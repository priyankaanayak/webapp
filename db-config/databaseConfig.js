const mysql = require('mysql');
const connection = mysql.createConnection({
    host     : 'localhost',
    user     : 'root',
    password : 'database',
    database : 'cloud_schema'
  });

module.exports = connection;
