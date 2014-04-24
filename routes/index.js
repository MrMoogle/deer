/*
 * GET home page.
 */
var pool = require('../dataConnection.js').pool; 
var CAS = require('cas');
var https = require('https');
https.globalAgent.options.secureProtocol = 'SSLv3_method';
var cas = new CAS({
  base_url: 'https://fed.princeton.edu/cas/', 
  service: 'http://localhost:3000/map', // change later
  version: 2.0
});

exports.index = function(req, res) {
  console.log(req.path);
  var list = {},
        rc = req.headers.cookie;

    rc && rc.split(';').forEach(function( cookie ) {
        var parts = cookie.split('=');
        list[parts.shift().trim()] = unescape(parts.join('='));
    });
  console.log('List');
  console.log(list);
  var key = list.ticket;

  console.log(req.url);
  res.location('index');
  if (key) {
    cas.validate(key, function(err, status, username) {
      if (err) res.send({error: err});
      else {
        console.log('Status: ' + status);
        if (status == false)
        {
          console.log(key);
          console.log(status);
          console.log("IsFAlse");
          res.redirect('https://fed.princeton.edu/cas/login?service=' + cas.service); 
        }
        console.log(status);
        pool.getConnection(function(err, connection) {
          // Checks for error
          if (err) 
            console.log('database connection error');
          
          // Queries database and renders page          
          connection.query('SELECT subject, mess, location, DATE_FORMAT(time, \'%l:%i %p\') as time, lat, longit, food FROM data ORDER by location', function(err, rows, fields) {
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
  {
    console.log("redirected");
    res.redirect('https://fed.princeton.edu/cas/login?service=' + cas.service); 
  }
};

exports.map = function(req, res){
  var ticket = req.param('ticket');
  if (ticket)
  {
    res.cookie('ticket', ticket, {path: '/'});
    console.log("added cookie");
    console.log(req.path);

     var list = {},
        rc = req.headers.cookie;

    rc && rc.split(';').forEach(function( cookie ) {
        var parts = cookie.split('=');
        list[parts.shift().trim()] = unescape(parts.join('='));
    });

    console.log(list);
    res.redirect('http://localhost:3000/index');
  }
};

exports.cover = function(req, res){
  res.render('cover', {
  title: 'Princeton Free Food Map'});
}
