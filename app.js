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
var foodlist = fs.readFileSync('./public/text/food2.txt').toString().toLowerCase().split("\n");
// Location dictionary
//var placelist = fs.readFileSync('./public/text/coordinates.txt').toString().toLowerCase().split("\n");
var placelist = fs.readFileSync('./public/text/locations2.txt').toString().toLowerCase().split("\n");

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
  var text;
  var time;

  // identify listserv
  var freefoodpatt = new RegExp("[.,-\/#!$%\^&\*;:{}=\-_`~()\s]*" + "[FreeFood]" +
                                "[.,-\/#!$%\^&\*;:{}=\-_`~()\s]*", "g");
  if (freefoodpatt.test(mail.subject)) {
    console.log("FreeFood listserv email recieved");
    text = mail.text.substr(0, mail.text.indexOf("-----"));
  }
  else {  // not [FreeFood], look for food 
    //if ()
    text = mail.text;
  }

  // NLP Code here 
  // Identify food and location in email text

  // food recognition
  for (var f = 0; f < foodlist.length; f++) {
    var pattm = new RegExp(" " + foodlist[f] + " ", "i");
    var pattf = new RegExp(foodlist[f] + " ", "i");
    var pattb = new RegExp(" " + foodlist[f], "i");
    if (pattm.test(text)) {
      console.log("Identified food m: " + foodlist[f]);
      food = foodlist[f];
      break;
    }
    if (pattf.test(text)) {
      console.log("Identified food f: " + foodlist[f]);
      food = foodlist[f];
      break;
    }
    if (pattb.test(text)) {
      console.log("Identified food b: " + foodlist[f]);
      food = foodlist[f];
      break;
    }
  }
  if (mail.subject !== null) {
    for (var f = 0; f < foodlist.length; f++) {
      var pattm = new RegExp(" " + foodlist[f] + " ", "i");
      var pattf = new RegExp(foodlist[f] + " ", "i");
      var pattb = new RegExp(" " + foodlist[f], "i");
      if (pattm.test(text)) {
        console.log("Identified food m: " + foodlist[f]);
        food = foodlist[f];
        break;
      }
      if (pattf.test(text)) {
        console.log("Identified food f: " + foodlist[f]);
        food = foodlist[f];
        break;
      }
      if (pattb.test(text)) {
        console.log("Identified food b: " + foodlist[f]);
        food = foodlist[f];
        break;
      }
    }
  }
  if (food === undefined) {
    food = "";
  }

  // location recognition
  // location in subject takes precedence over location in text
  for (var p = 0; p < placelist.length; p++) {
    var place = placelist[p].split("\t")[0];
    var patt;
    console.log("Is it at: " + place);
    patt = new RegExp("(^| )" + place + "(?![a-zA-Z])", "i");
    if (patt != undefined && patt.test(text)) {
      console.log("Identified place text: " + placelist[p]);
      location = placelist[p]
      break;
    }
  }
  if (mail.subject !== null) {
    for (var p = 0; p < placelist.length; p++) {
      var place = placelist[p].split("\t")[0];
      var patt;
      patt = new RegExp("(^| )" + place + "(?![a-zA-Z])", "i");
      if (patt != undefined && patt.test(mail.subject)) {
        console.log("Identified place subject: " + placelist[p]);
        location = placelist[p]
        break;  
      }
    }
  }
  if (location !== undefined) {
    location = location.split("\t");
    var lat = Number(location[1].split(", ")[0]);
    var longit = Number(location[1].split(", ")[1]);
  }
  else {
    location = "";
    var lat = "";
    var longit = "";
  }

  // time extraction
  var pattd = /at \d?\d/i;
  var pattf = /at \d?\d:\d\d/i;

  if (pattf.test(mail.subject)) {
    time = pattf.exec(mail.subject)[0].split(" ")[1];
  }
  else if (pattd.test(mail.subject)) {
    time = pattd.exec(mail.subject)[0].split(" ")[1];
  }
  else if (pattf.test(text)) {
    time = pattf.exec(text)[0].split(" ")[1];
  }
  else if (pattd.test(text)) {
    time = pattd.exec(text)[0].split(" ")[1];
  }
  console.log("Time: " + time);
  if (time === undefined) {
    time = "";
  }

  // Inserts into database 
  pool.getConnection(function(err, connection) {
    if (err) console.log('database connection error');
    var query = 'INSERT INTO data(subject, mess, location, time, lat, longit, food) VALUES(\'' + 
                mail.subject + '\', \'' + (text).slice(0,-1) + '\', \'' + location[0] + '\', \'' + 
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
app.get('/users', user.list);
app.get('/map', routes.map);

http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});