var mysql      = require('mysql');
var pool  = mysql.createPool({
  host     : 'deerdb.cqjm6e2t1gja.us-west-2.rds.amazonaws.com',
  database : 'deerdb',
  user     : 'deerdb',
  password : 'deerdb333',
});
exports.pool = pool;