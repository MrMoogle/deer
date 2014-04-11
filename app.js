// Dependencies
var express     = require('express');
var routes      = require('./routes');
var user        = require('./routes/user');
var http        = require('http');
var path        = require('path');
var MailListener= require("mail-listener2");
var fs          = require('fs');
var natural     = require('natural');
var app         = express();
var mysql       = require('mysql');
var pool        = require('./dataConnection.js').pool;

// Food word dictionary
var foodlist = fs.readFileSync('./public/text/food.txt').toString().toLowerCase().split("\n");
// Location dictionary
var placelist = fs.readFileSync('./public/text/coordinates.txt').toString().toLowerCase().split("\n");

/*-------------- Mail Listener ----------------*/
var mailListener = new MailListener({
  username: "pfreefoodmap",
  password: "pfreefoodmap333",
  host: "imap.gmail.com",
  port: 993, // imap port
  tls: true,
  tlsOptions: { rejectUnauthorized: false },
  mailbox: "INBOX", // mailbox to monitor
  searchFilter: "UNSEEN", // the serach filter being used after an IDLE notification has been retrieved
  markSeen: true, // all fetched email willbe marked as seen and not fetched next time
  fetchUnreadOnStart: true, // use it only if you want to get all unread email on lib start. Default is `false`,
  mailParserOptions: {streamAttachments: true} // options to be passed to mailParser lib.
});

// event listener for when new email is received
mailListener.on("mail", function(mail){
  // Constructs current date
  var date = new Date();
  var curr_time = (date.getYear() + 1900) + '-' + date.getMonth() + '-' + date.getDate() + ' '
                   + date.getHours() + ':' + date.getMinutes() + ":" + date.getSeconds();
  var location;
  var food;

  // NLP Code here 
  // Identify food and location in email text
  var tokenizer = new natural.WordTokenizer();
  var nounInflector = new natural.NounInflector();
  var message = tokenizer.tokenize(mail.text);
  console.log("Tokenized message: " + message);
  // food recognition
  for (var w = 0; w < message.length; w++) {
    console.log("In consideration: " + message[w]);
    var patt = new RegExp(" " + nounInflector.singularize(message[w]).toLowerCase() + "$", "g");
    var patt2 = new RegExp("^" + nounInflector.singularize(message[w]).toLowerCase() + " ", "g");
    var patt3 = new RegExp("^" + nounInflector.singularize(message[w]).toLowerCase() + "$", "g");

    // food recognition
    for (var f = 0; f < foodlist.length; f++) {
      if (patt.test(foodlist[f])) {
        console.log("Identified food: " + message[w]);
        food = message[w];
        break;
      }
      else if (patt2.test(foodlist[f])) {
        console.log("Identified food2: " + message[w]);
        food = message[w];
        break;
      }
      else if (patt3.test(foodlist[f])) {
        console.log("Identified food3: " + message[w]);
        food = message[w];
        break;
      }
    }
  }

  // location recognition
  for (var w = 0; w < message.length; w++) {
    console.log("In consideration: " + message[w]);
    var patt = new RegExp(" " + message[w].toLowerCase() + "$", "g");
    var patt2 = new RegExp("^" + message[w].toLowerCase() + " ", "g");
    var patt3 = new RegExp("^" + message[w].toLowerCase() + "$", "g");

    for (var p = 0; p < placelist.length; p++) {
      if (patt.test(placelist[p])) {
        console.log("Identified place: " + message[w]);
        location = placelist[p];
        break;
      }
       else if (patt2.test(placelist[p])) {
        console.log("Identified place2: " + message[w]);
        location = placelist[p];
        break;
      }
      else if (patt3.test(placelist[p])) {
        console.log("Identified place3: " + message[w]);
        break;
      }
    }
  }

  location = location.split("\t");
  var lat = Number(location[1].split(", ")[0]);
  var longit = Number(location[1].split(", ")[1]);

  // Inserts into database 
  pool.getConnection(function(err, connection) {
    if (err) console.log('database connection error');
    var query = 'INSERT INTO data(subject, mess, location, time, lat, longit, food) VALUES(\'' + 
                mail.subject + '\', \'' + (mail.text).slice(0,-1) + '\', \'' + location[0] + '\', \'' + 
                curr_time + '\', \'' + lat + '\', \'' + longit + '\', \'' + food + '\')';
    console.log(query);
    connection.query(query);
    connection.release();
  });
});

// event listener for server connection
mailListener.on("server:connected", function(){
  console.log("imapConnected");
});

// event listener for server disconnection
mailListener.on("server:disconnected", function(){
  console.log("imapDisconnected");
});

// event listener for errors
mailListener.on("error", function(err){
  console.log(err);
});

mailListener.start(); // start listening

/*-------------- Environments ----------------*/
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

app.get('/', routes.index);
app.get('/cas_login', routes.cas_login);
app.get('/users', user.list);
app.get('/map', routes.map);

http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});