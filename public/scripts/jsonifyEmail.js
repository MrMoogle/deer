/*--------------------------------------------------*/
/* Author: Oscar Li
/* Date: 6/7/2014
/* Purpose: Print out all unread emails in JSON format
/*--------------------------------------------------*/

var pool = require('../../dataConnection.js').pool
var MailListener= require("mail-listener2");
var fs = require('fs');
var outputFilename = 'email.json';

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
    var obj = {};
    obj.subject = mail.subject;
    obj.message = mail.text;
    obj.label = null; 

    var jsonString = JSON.stringify(obj);

    console.log(JSON.parse(jsonString));
})

// event listener for errors
mailListener.on("error", function(err){
  	console.log(err);
});

mailListener.start(); // start listening