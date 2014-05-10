/**
 * trainNB.js 
 * Train Naive Bayes classifier to classify non-freefood listserv emails as being 
 * free food or not. Labels are "yes", "no", or "U" meaning not yet labeled.
 */

var natural = require('natural');
var MailListener= require("mail-listener2");
var pool = require('./dataConnection.js').pool;

pool.getConnection(function(err, connection) {
	if (err)
		console.log("database connection error");
	connection.query("SELECT * FROM traindata", function(err, rows, fields) {
		if (err)
			console.log("traindata database query error");
		var classifier = new natural.BayesClassifier();
		for (var i = 0; i < rows.length; i++) {
			if (rows[i].label != "U")
				classifier.addDocument(rows[i].subject, rows[i].label);
		}
		classifier.train();
		classifier.save('classifier.json', function(err, classifier) {
		});
		console.log("Classifier saved and trained");
	});
});


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

// test classifier 
natural.BayesClassifier.load('classifier.json', null, function(err, classifier) {
	if (err)
		console.log("error loading classifier");
    // small test cases
    console.log();
    console.log("--------------------- Testing Classifier --------------------");
    console.log("'RSVP please' is free food: " + classifier.classify("RSVP please"));
    console.log("'Free chicken at concert!' is free food: " + classifier.classify("Free chicken at concert!"));
    console.log("'Writing sem appointment' is free food: " + classifier.classify("Writing sem appointment"));
    console.log("'Science Fair' is free food: " + classifier.classify("Science Fair"));
    console.log("'lost my coat at tower help!' is free food: " + classifier.classify('lost my coat at tower help!'));
    console.log("'Mad Women conference on gender' is free food: " + classifier.classify('Mad Women conference on gender'));
    console.log("'I have tickets to the concert' is free food: " + classifier.classify('I have tickets to the concert'));
 	  console.log("'Bike stolen' is free food: " + classifier.classify('Bike stolen'));
 	  console.log("'Qdoba and pizza!' is free food: " + classifier.classify('Qdoba and pizza!'));
 	  console.log("'Feed the hungry' is free food: " + classifier.classify('Feed the hungry'));
    console.log("'Students in fashion panel' is free food: " + classifier.classify('Students in fashion panel'));
    console.log("'Participate in 5-minute survey + Win one of two $25 Amazon gift cards!' is free food: " + 
                classifier.classify('Participate in 5-minute survey + Win one of two $25 Amazon gift cards!'));

 	
 	var i = 0;
    mailListener.on("mail", function(mail) { 
    	console.log("---------------- Test Email " + i + " ---------------");
    	console.log("Email subject: " + mail.subject);
    	console.log("is free food: " + classifier.classify(mail.subject));
    	console.log("Email body: " + mail.text);
    	console.log("is free food: "+ classifier.classify(mail.text))
    	i++;
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
