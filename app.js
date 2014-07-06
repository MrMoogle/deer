// Dependencies
var express     = require('express');
var routes      = require('./routes');
var http        = require('http');
var path        = require('path');
var MailListener= require("mail-listener2");
var natural     = require('natural');
var app         = express();
var mysql       = require('mysql');
var pool        = require('./dataConnection').pool;
var parse       = require('./parse')

/*-------------- Mail Listener ----------------*/
var mailListener = new MailListener({
  username: "pfreefoodmap",
  password: "pfreefoodmap333",
  host: "imap.gmail.com",
  port: 993, // imap port
  tls: true,
  tlsOptions: { rejectUnauthorized: false },
  mailbox: "INBOX", // mailbox to monitor
  searchFilter: "UNSEEN", // the search filter being used after an IDLE notification has been retrieved
  markSeen: true, // all fetched email willbe marked as seen and not fetched next time
  fetchUnreadOnStart: true, // use it only if you want to get all unread email on lib start. Default is `false`,
  mailParserOptions: {streamAttachments: true} // options to be passed to mailParser lib.
});

// event listener for when new email is received
natural.BayesClassifier.load('classifier.json', null, function(err, classifier) {
      if (err)
        console.log("classifier loading error");
      
  mailListener.on("mail", function(mail) {
    var text;
    
    // identify listserv
    var freefoodpatt = new RegExp("\\[FreeFood\\]", "g");
    if (freefoodpatt.test(mail.subject)) {  
      console.log("FreeFood listserv email recieved");
      text = mail.text.slice(0, mail.text.indexOf("-----"));
      parse.parseEmail(text, mail.subject); // - foodlist, placelist
    }
    else {  
      console.log("Other email received"); 
      // save example to train on later
      pool.getConnection(function(errtrain, connection) {
        if (errtrain) 
          console.log("database connection error");
        var pattapos = /\'/g;
        var pattback = /\\/g;
        text = mail.text.replace(pattback, "\\\\");
        text = mail.text.replace(pattapos, "\\'");
        var query = 'INSERT INTO traindata(subject, mess, label) VALUES ( \'' + 
                    mail.subject.replace("/\n/g", " ") + '\', \'' + 
                    text.slice(0,-1).replace("/\n/g") + '\',\'' + "U" + '\')';
        connection.query(query);
        console.log("Storing example into training set: " + query);
        connection.release();
      });

      // Classify email, and parse if classified as free food
      if (classifier.classify(mail.subject) === "yes") {
        console.log("Classifying as free food email, and parsing");
        text = mail.text;
        parse.parseEmail(text, mail.subject); // - foodlist, placelist
      }
      else {
        console.log("Classifying as not a free food email");
      }  
    }
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
app.use(express.favicon(__dirname + '/public/images/favicon.ico'));
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.use(express.logger('dev'));
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.bodyParser());

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

app.get('/', routes.cover);
app.get('/map', routes.map);
app.get('/index', routes.index);

app.post('/index', routes.addfood);

http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});