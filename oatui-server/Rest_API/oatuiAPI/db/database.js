const config = require('config');
var mysql = require("mysql");
let connectionLimit = config.get('db.connectionLimit'); 
let host = config.get('db.host');
let user = config.get('db.user');
let password = config.get('db.password');
let database = config.get('db.database');

const pool = mysql.createPool({
            connectionLimit : connectionLimit,
            host     : host,
            user     : user,
            password : password,
            database : database,
            debug    : false 
            });                    
 
 
function executeQuery(sql, callback) {
    pool.getConnection((err,connection) => {
        if(err) {
            return callback(err, null);
        } else {
            if(connection) {
                connection.query(sql, function (error, results, fields) {
                connection.release();
                if (error) {
                    return callback(error, null);
                } 
                return callback(null, results);
                });
            }
        }
    });
}
 
function query(sql, callback) {    
    executeQuery(sql,function(err, data) {
        if(err) {
            return callback(err);
        }       
        callback(null, data);
    });
}
 
module.exports = {
    query: query
}
