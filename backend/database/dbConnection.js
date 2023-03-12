const mysql = require('mysql');
const conn = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'schoolmanagement'
});

conn.connect( err => {
    if (err) {
        throw err;
    }
    console.log('Database is connected successfully !');
});

module.exports = conn;