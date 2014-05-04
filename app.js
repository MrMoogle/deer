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
var placelist = fs.readFileSync('./public/text/locations3.txt').toString().toLowerCase().split("\n");

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
  var curr_time = (date.getYear() + 1900) + '-' + (date.getMonth()+1) + '-' + date.getDate() + ' '
                   + date.getHours() + ':' + date.getMinutes() + ":" + date.getSeconds();
  var location;
  var food;
  var text;
  var time;

  // identify listserv
  var freefoodpatt = new RegExp("\\[FreeFood\\]", "g");
  if (freefoodpatt.test(mail.subject)) {
    console.log("FreeFood listserv email recieved");
    var start = (mail.text).indexOf("freefood@princeton.edu") + 22;
    var temptext = (mail.text).slice(start, mail.text.length);
    var finish = (temptext).indexOf("-----");
    text = (temptext).slice(0, finish);
  }
  else {  // not [FreeFood], look for food 
    text = mail.text;
  }

  // food recognition
  for (var f = 0; f < foodlist.length; f++) {
    var patt = new RegExp("(^| )" + foodlist[f] + "(?![^es\t\n ])", "i");
    if (patt.test(text)) {
      console.log("Identified food: " + foodlist[f]);
      food = foodlist[f];
      break;
    }
  }
  if (mail.subject !== null) {
    for (var f = 0; f < foodlist.length; f++) {
      var patt = new RegExp("(^| )" + foodlist[f] + "(?![^es\t\n ])", "i");
      if (patt.test(mail.subject)) {
        console.log("Identified food: " + foodlist[f]);
        food = foodlist[f];
        break;
      }  
    }
  }
  if (food === undefined) {
    return;
  }

  // location recognition
  // location in subject takes precedence over location in text
  for (var p = 0; p < placelist.length; p++) {
    var place = placelist[p].split("\t")[0];
    var patt = new RegExp("(^| )" + place + "(?![a-zA-Z])", "i");
    if (patt != undefined && patt.test(text)) {
      console.log("Identified place text: " + placelist[p]);
      location = placelist[p]
      break;
    }
  }
  if (mail.subject !== null) {
    for (var p = 0; p < placelist.length; p++) {
      var place = placelist[p].split("\t")[0];
      var patt = new RegExp("(^| )" + place + "(?![a-zA-Z])", "i");
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
  var pattg = /Jan[.\s] \d?\d|Feb[.\s] \d?\d|Mar[.\s] \d?\d|Apr[.\s] \d?\d|May[.\s] \d?\d|Jun[e.\s] \d?\d|Jul[y.\s] \d?\d|Aug[.\s] \d?\d|Sep[t.\s] \d?\d|Oct[.\s] \d?\d|Nov[.\s] \d?\d|Dec[.\s] \d?\d|January \d?\d|February \d?\d|March \d?\d|April \d?\d|August \d?\d|September \d?\d|October \d?\d|November \d?\d|December \d?\d/i;

  var months = new Array("Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec");
  var match = "";
  var month = "";
  var cal;

  var day;
  if (pattg.test(mail.subject)) {
    match = pattg.exec(mail.subject)[0];
    month = months.indexOf(match.split(" ")[0] + " ".substring(0,3)) + 1;
    day = match.split(" ")[1] + " ";
    cal = (date.getYear() + 1900) + '-' + month + '-' + day;
  }
  else if (pattg.test(text)) {
    match = pattg.exec(text)[0];
    month = months.indexOf(match.split(" ")[0].substring(0,3)) + 1;
    day = match.split(" ")[1] + " ";
    cal = (date.getYear() + 1900) + '-' + month + '-' + day;
  }
  if (cal === undefined) {
    cal = (date.getYear() + 1900) + '-' + (date.getMonth() + 1) + '-' + date.getDate();
  }
  console.log("Match " + match);
  console.log("Month: " + month);
  console.log("Day: " + day);
  console.log("Date: " + date.getDate());
  console.log("Date2: " + cal)

  var findAM = false;

  var pattd = /at\s?\d?\d/i;
  var pattf = /at\s?\d?\d:\d\d/i;
  var patth = /from\s?\d?\d/i;
  var patti = /from\s?\d?\d:\d\d/i;
  var pattj = /\d?\d\s?\-\s?\d?\d/i;
  var pattk = /\d?\d:\d\d\s?\-\s?\d?\d/i;
  var pattl = /between\s?\d?\d/i;
  var pattm = /between\s?\d?\d:\d\d/i;
  var pattn = /\d?\d\s?to/i;
  var patto = /\d?\d:\d\d\s?to/i;

  var pattam = /\d?\d\s?am/i;
  var pattam2 = /\d?\d:\d\d\s?am/i;
  var pattpm = /\d?\d\s?pm/i;
  var pattpm2 = /\d?\d:\d\d\s?pm/i;

  var isam = /\d?\d\s?am|\d?\d:\d\d\s?am/i

  var pattnum = /\d?\d/i;
  var pattnum2 = /\d?\d:\d\d/i;
  var setCurr = false;

  if (pattf.test(mail.subject)) {
    temp = pattf.exec(mail.subject)[0];
    time = pattnum2.exec(temp);
    time = time + ":00";
  }
  else if (pattd.test(mail.subject)) {
    temp = pattd.exec(mail.subject)[0];
    time = pattnum.exec(temp);
    time = time + ":00:00";
  }
  else if (patti.test(mail.subject)) {
    temp = patti.exec(mail.subject)[0];
    time = pattnum2.exec(temp);
    time = time + ":00";
  }
  else if (patth.test(mail.subject)) {
    temp = patth.exec(mail.subject)[0];
    time = pattnum.exec(temp);
    time = time + ":00:00";
  }
  else if (pattk.test(mail.subject)) {
    temp = pattk.exec(mail.subject)[0];
    time = pattnum2.exec(temp);
    time = time + ":00";
  }
  else if (pattj.test(mail.subject)) {
    temp = pattj.exec(mail.subject)[0];
    time = pattnum.exec(temp);
    time = time + ":00:00";
  }
  else if (pattm.test(mail.subject)) {
    temp = pattm.exec(mail.subject)[0];
    time = pattnum2.exec(temp);
    time = time + ":00";
  }
  else if (pattl.test(mail.subject)) {
    temp = pattl.exec(mail.subject)[0];
    time = pattnum.exec(temp);
    time = time + ":00:00";
  }
  else if (patto.test(mail.subject)) {
    temp = patto.exec(mail.subject)[0];
    time = pattnum2.exec(temp);
    time = time + ":00";
  }
  else if (pattn.test(mail.subject)) {
    temp = pattn.exec(mail.subject)[0];
    time = pattnum.exec(temp);
    time = time + ":00:00";
  }
  else if (pattam2.test(mail.subject)) {
    temp = pattam2.exec(mail.subject)[0];
    time = pattnum2.exec(temp);
    time = time + ":00";
  }
  else if (pattam.test(mail.subject)) {
    temp = pattam.exec(mail.subject)[0];
    time = pattnum.exec(temp);
    time = time + ":00:00";

  }
  else if (pattpm2.test(mail.subject)) {
    temp = pattpm2.exec(mail.subject)[0];
    time = pattnum2.exec(temp);
    time = time + ":00";
  }
  else if (pattpm.test(mail.subject)) {
    temp = pattpm.exec(mail.subject)[0];
    time = pattnum.exec(temp);
    time = time + ":00:00";
  }
  else {
    time = date.getHours() + ':' + date.getMinutes() + ":" + date.getSeconds();
    setCurr = true;
  }
 
  if (pattf.test(text)) {
    temp = pattf.exec(text)[0];
    time = pattnum2.exec(temp);
    time = time + ":00";
  }
  else if (pattd.test(text)) {
    temp = pattd.exec(text)[0];
    time = pattnum.exec(temp);
    time = time + ":00:00";
  }
  else if (patti.test(text)) {
    temp = patti.exec(text)[0];
    time = pattnum2.exec(temp);
    time = time + ":00";
  }
  else if (patth.test(text)) {
    temp = patth.exec(text)[0];
    time = pattnum.exec(temp);
    time = time + ":00:00";
  }
  else if (pattk.test(text)) {
    temp = pattk.exec(text)[0];
    time = pattnum2.exec(temp);
    time = time + ":00";
  }
  else if (pattj.test(text)) {
    temp = pattj.exec(text)[0];
    time = pattnum.exec(temp);
    time = time + ":00:00";
  }
  else if (pattm.test(text)) {
    temp = pattm.exec(text)[0];
    time = pattnum2.exec(temp);
    time = time + ":00";
  }
  else if (pattl.test(text)) {
    temp = pattl.exec(text)[0];
    time = pattnum.exec(temp);
    time = time + ":00:00";
  }
  else if (patto.test(text)) {
    temp = patto.exec(text)[0];
    time = pattnum2.exec(temp);
    time = time + ":00";
  }
  else if (pattn.test(text)) {
    temp = pattn.exec(text)[0];
    time = pattnum.exec(temp);
    time = time + ":00:00";
  }
  else if (pattam2.test(text)) {
    temp = pattam2.exec(text)[0];
    time = pattnum2.exec(temp);
    time = time + ":00";
  }
  else if (pattam.test(text)) {
    temp = pattam.exec(text)[0];
    time = pattnum.exec(temp);
    time = time + ":00:00";
  }
  else if (pattpm2.test(text)) {
    temp = pattpm2.exec(text)[0];
    time = pattnum2.exec(temp);
    time = time + ":00";
  }
  else if (pattpm.test(text)) {
    temp = pattpm.exec(text)[0];
    time = pattnum.exec(temp);
    time = time + ":00:00";
  }
  // else if (time === undefined)
  //   time = date.getHours() + ':' + date.getMinutes() + ":" + date.getSeconds();

  findAM = isam.test(text) | isam.test(mail.subject);
  if (!isam.test(text) && !isam.test(mail.subject) && !setCurr)
  {
    temp = time.split(':');
    time = (parseInt(temp[0]) + 12) + ":" + temp[1] + ":00";
  }

  console.log("TIME IS: " + time);

  // var pattk = /\d?\d|\d?\d:\d?\d/i;
  
  // var index = mail.subject.search(pattj);
  // if (index > 0)
  // {
  //   find = mail.subject.slice(0, index).match(pattk);

  // }

  // if (patti.test(mail.subject)) {
  //   time = patti.exec(mail.subject)[0].replace("am", "").trim() + ":00";
  // }
  // else if (pattf.test(mail.subject)) {
  //   time = pattf.exec(mail.subject)[0].split(" ")[1];
  //   temp = time.split(':
  //   time = (parseInt(temp[0]) + 12) + ":" + temp[1] + ":00";
  // }
  // else if (patth.test(mail.subject)) {
  //   time = patth.exec(mail.subject)[0].replace("am", "").trim() + ":00:00";
  // }
  // else if (pattd.test(mail.subject)) {
  //   time = pattd.exec(mail.subject)[0].split(" ")[1];
  //   time = (parseInt(time) + 12) + ":00:00";
  // }
  // else if (pattf.test(text)) {
  //   time = pattf.exec(text)[0].split(" ")[1];
  //   temp = time.split(':');
  //   time = (parseInt(temp[0]) + 12) + ":" + temp[1] + ":00";
  // }
  // else if (pattd.test(text)) {
  //   time = pattd.exec(text)[0].split(" ")[1];
  //   time = (parseInt(time) + 12) + ":00:00";
  // }
  // console.log("Time: " + time);
  // if (time === undefined) {
  //   time = date.getHours() + ':' + date.getMinutes() + ":" + date.getSeconds();
  // }
  pattapos = /\'/g;
  pattback = /\\/g;
  text = text.replace(pattback, "\\\\");
  text = text.replace(pattapos, "\\'");

  console.log(text);

  // Inserts into database 
  pool.getConnection(function(err, connection) {
    if (err) console.log('database connection error');
    var query = 'INSERT INTO data(subject, mess, location, time, lat, longit, food) VALUES(\'' + 
                mail.subject + '\', \'' + text.slice(0,-1) + '\', \'' + location[0] + '\', \'' + 
                cal + " " + time + '\', \'' + lat + '\', \'' + longit + '\', \'' + food + '\')';
    
    /*---------------------- Test section ------------*/
    //insert into test database
    // var query = 'INSERT INTO datatest(subject, mess, location, time, lat, longit, food) VALUES(\'' + 
    //            mail.subject + '\', \'' + text.slice(0,-1) + '\', \'' + location[0] + '\', \'' + 
    //            cal + " " + time + '\', \'' + lat + '\', \'' + longit + '\', \'' + food + '\')';
    /*------------------------------------------------*/

    console.log(query + "\n");
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

app.get('/', routes.cover);
app.get('/users', user.list);
app.get('/map', routes.map);
app.get('/index', routes.index);

http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});