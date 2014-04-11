/*
 * GET home page.
 */

 var pool = require('../dataConnection.js').pool; 
 var CAS = require('cas');
 var cas = new CAS({
 	base_url: 'https://fed.princeton.edu/cas/', 
 	service: 'DEER',
 	version: 1.0
 });

exports.cas_login = function(req, res) {
  var ticket = req.param('ticket');
  console.log("TICKET" + ticket);
  if (ticket) {
  	console.log("TICKET" + ticket);
    cas.validate(ticket, function(err, status, username) {
      if (err) {
        // Handle the error
        res.send({error: err});
      } else {
        // Log the user in
        res.redirect('/');
        // res.send({status: status, username: username});
      }
    });
  } else {
  	console.log("FAIL" + ticket);
    res.redirect('https://fed.princeton.edu/cas/');
  }
};
 // exports.cas_login = function(req, res) {
 // 	cas.authenticate(req, res, function(err, status, username, extended) {
 // 		console.log("AAAA");
 // 		if (err) {
 //          // Handle the error
 //          console.log("ERRROR");
 //          res.send({error: err});
 //      	} else {
 //          // Log the user in 
 //          console.log("Log in UserERRROR");
 //          res.send({status: status, username: username});
 //      	}
 //  	});    
 // }

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
 	res.send("MAP");
 	res.render('layout', { title: 'Look at my map bitchez!' });
 };