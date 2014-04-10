/*
 * GET home page.
 */

var pool = require('../dataConnection.js').pool; 

exports.index = function(req, res){
	pool.getConnection(function(err, connection) {
		if (err) console.log('database connection error');
		connection.query('SELECT * FROM data', function(err, rows, fields) {
			if (err) console.log('database connection error');
			res.render('index', {
				title: 'Princeton Free Food Map',
				dataRows: rows
			});
		})
		connection.release(); 
	});
};

exports.map = function(req, res){
  res.render('map', { title: 'Look at my map bitchez!' });
};