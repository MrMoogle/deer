var mysql      = require('mysql');
var pool  = mysql.createPool({
  host     : 'deerdb.cincrxdxlun1.us-east-1.rds.amazonaws.com',
  database : 'deerdb',
  user     : 'deerdb',
  password : 'ptonfreefood',
});
exports.pool = pool;