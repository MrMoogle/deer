/*--------------------------------------------------*/
/* Author: Oscar Li
/* Date: 6/7/2014
/* Purpose: Insert all unread emails into database. 
/*--------------------------------------------------*/

var pool = require('../../dataConnection.js').pool
var MailListener= require("mail-listener2");

var mailListener = new MailListener({
  	username: "pfreefoodmap",
  	password: "pfreefoodmap333",
  	host: "imap.gmail.com",
  	port: 993, 
  	tls: true,
  	tlsOptions: { rejectUnauthorized: false },
  	mailbox: "INBOX",
  	searchFilter: "UNSEEN",
  	markSeen: true, 
  	fetchUnreadOnStart: true, 
  	mailParserOptions: {streamAttachments: true} 
});
		      	
mailListener.on("mail", function(mail) {
	console.log(mail.text);
	console.log(mail.subject);
})

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