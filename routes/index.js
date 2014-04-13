/*
 * GET home page.
 */
var pool = require('../dataConnection.js').pool; 
var CAS = require('cas');
var https = require('https');
https.globalAgent.options.secureProtocol = 'SSLv3_method';
var cas = new CAS({
  base_url: 'https://fed.princeton.edu/cas/', 
  service: 'http://localhost:3000', // change later
  version: 2.0
});

exports.index = function(req, res) {
  var ticket = req.param('ticket');

  if (ticket) {
    cas.validate(ticket, function(err, status, username) {
      if (err) res.send({error: err});
      else {
        pool.getConnection(function(err, connection) {
          // Checks for error
          if (err) 
            console.log('database connection error');
          
          // Queries database and renders page          
          connection.query('SELECT * FROM data', function(err, rows, fields) {
            if (err) console.log('database query error');
            res.render('index', {
              title: 'Princeton Free Food Map',
              dataRows: rows,
              status: status,
              username: username
            });
          });
          
          // Terminates connection
          connection.release(); 
        });
      }
    });
  } 
  else 
    res.redirect('https://fed.princeton.edu/cas/login?service=' + cas.service); 
};

exports.map = function(req, res){
	res.send("MAP");
	res.render('layout', { title: 'Look at my map bitchez!' });
};