var mysql      = require('mysql');
var connection  = mysql.createConnection({
  host     : 'deerdb.cqjm6e2t1gja.us-west-2.rds.amazonaws.com',
  database : 'deerdb',
  user     : 'deerdb',
  password : 'deerdb333',
});
exports.connection = connection;