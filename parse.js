/**
 * parse.js
 * Email parsing functions
 */

var pool = require('./dataConnection').pool;
var fs   = require('fs');

// Food word dictionary
var foodlist = fs.readFileSync('./public/text/food2.txt').toString().toLowerCase().split("\n");

// Location dictionary
var placelist = fs.readFileSync('./public/text/locations3.txt').toString().toLowerCase().split("\n");

/*-----------------------------------------------------------------------------------------*/

/**
 * findFood: Takes list of approved food strings and text string as input. Finds and returns
 * first food string found in text. Return empty string if none found.
 */
var findFood = function(text) {  // - foodlist
  for (var f = 0; f < foodlist.length; f++) {
    var patt = new RegExp("(^| )" + foodlist[f] + "(?![^es\t\n ])", "i");
    if (patt.test(text)) {
      console.log("-----")
      console.log("Identified food: " + foodlist[f]);
      return foodlist[f];
    }
  }
  return "";
}

/**
 * findPlace: Takes list of approved place strings and text string as input. Finds and returns
 * first place string found in text. Return empty string if none found.
 */
var findPlace = function(text) {  // - placelist
  // remove potential sources of confusion
  text = text.replace(/bent spoon/ig, "");
  text = text.replace(/ivy league/ig, "");

  for (var p = 0; p < placelist.length; p++) {
    var place = placelist[p].split("\t")[0];
    var patt = new RegExp("(^| )" + place + "(?![a-zA-Z])", "i");
    if (patt != undefined && patt.test(text)) {
      console.log("-----")
      console.log("Identified place text: " + placelist[p]);
      return placelist[p]
    }
  }
  return "";
}

/**
 * findCal: determine the day of the year of the food event from the 
 * email subject and messsage.
 */
var findCal = function(text, subject, date) {
  var cal;
  var pattg = /Jan[.\s] \d?\d|Feb[.\s] \d?\d|Mar[.\s] \d?\d|Apr[.\s] \d?\d|May[.\s] \d?\d|Jun[e.\s] \d?\d|Jul[y.\s] \d?\d|Aug[.\s] \d?\d|Sep[t.\s] \d?\d|Oct[.\s] \d?\d|Nov[.\s] \d?\d|Dec[.\s] \d?\d|January \d?\d|February \d?\d|March \d?\d|April \d?\d|August \d?\d|September \d?\d|October \d?\d|November \d?\d|December \d?\d/i;
  var patth = /\d?\d\/\d?\d/

  var months = new Array("Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec");
  var match = "";
  var month = "";
  var temp;
  

  var day;
  if (pattg.test(subject)) {
    match = pattg.exec(subject)[0];
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
  else if (patth.test(subject)) {
    match = patth.exec(subejct)[0];
    temp = match.split('/');
    month = parseInt(temp[0]);
    day = parseInt(temp[1]);
    cal = (date.getYear() + 1900) + '-' + month + '-' + day;
  }
  else if (patth.test(text)) {
    match = patth.exec(text)[0];
    temp = match.split('/');
    month = parseInt(temp[0]);
    day = parseInt(temp[1]);
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

  return cal;
}

/**
 * findTime: determine the time of day of the food event from the email subject and message.
 */
var findTime = function(text, subject, date) {
  var time;
  var findAM = false;

  var pattd = /at\s?\*?\d?\d/i;
  var pattf = /at\s?\*?\d?\d:\d\d/i;
  var patth = /from\s?\*?\d?\d/i;
  var patti = /from\s?\*?\d?\d:\d\d/i;
  var pattj = /\d?\d\s?\-\s?\d?\d[^\d]/i;
  var pattk = /\d?\d:\d\d\s?\-\s?\d?\d[^\d]/i;
  var pattl = /between\s?\*?\d?\d/i;
  var pattm = /between\s?\*?\d?\d:\d\d/i;
  var pattn = /\d?\d\s?to|\d?\d\s?o'?clock/i;
  var patto = /\d?\d:\d\d\s?to|\d?\d:\d\d\s?o'?clock/i;

  var pattam = /\d?\d\s?am/i;
  var pattam2 = /\d?\d:\d\d\s?am/i;
  var pattpm = /\d?\d\s?pm/i;
  var pattpm2 = /\d?\d:\d\d\s?pm/i;

  var isam = /\d?\d\s?am|\d?\d:\d\d\s?am/i;

  var pattnum = /\d?\d/i;
  var pattnum2 = /\d?\d:\d\d/i;
  var setCurr = false;

  if (pattf.test(subject)) {
    temp = pattf.exec(subject)[0];
    time = pattnum2.exec(temp);
    time = time + ":00";
  }
  else if (pattd.test(subject)) {
    temp = pattd.exec(subject)[0];
    time = pattnum.exec(temp);
    time = time + ":00:00";
  }
  else if (patti.test(subject)) {
    temp = patti.exec(subject)[0];
    time = pattnum2.exec(temp);
    time = time + ":00";
  }
  else if (patth.test(subject)) {
    temp = patth.exec(subject)[0];
    time = pattnum.exec(temp);
    time = time + ":00:00";
  }
  else if (pattk.test(subject)) {
    temp = pattk.exec(subject)[0];
    time = pattnum2.exec(temp);
    time = time + ":00";
  }
  else if (pattj.test(subject)) {
    temp = pattj.exec(subject)[0];
    time = pattnum.exec(temp);
    time = time + ":00:00";
  }
  else if (pattm.test(subject)) {
    temp = pattm.exec(subject)[0];
    time = pattnum2.exec(temp);
    time = time + ":00";
  }
  else if (pattl.test(subject)) {
    temp = pattl.exec(subject)[0];
    time = pattnum.exec(temp);
    time = time + ":00:00";
  }
  else if (patto.test(subject)) {
    temp = patto.exec(subject)[0];
    time = pattnum2.exec(temp);
    time = time + ":00";
  }
  else if (pattn.test(subject)) {
    temp = pattn.exec(subject)[0];
    time = pattnum.exec(temp);
    time = time + ":00:00";
  }
  else if (pattam2.test(subject)) {
    temp = pattam2.exec(subject)[0];
    time = pattnum2.exec(temp);
    time = time + ":00";
  }
  else if (pattam.test(subject)) {
    temp = pattam.exec(subject)[0];
    time = pattnum.exec(temp);
    time = time + ":00:00";

  }
  else if (pattpm2.test(subject)) {
    temp = pattpm2.exec(subject)[0];
    time = pattnum2.exec(temp);
    time = time + ":00";
  }
  else if (pattpm.test(subject)) {
    temp = pattpm.exec(subject)[0];
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
    setCurr = false;
  }
  else if (pattd.test(text)) {
    temp = pattd.exec(text)[0];
    time = pattnum.exec(temp);
    time = time + ":00:00";

    setCurr = false;
  }
  else if (patti.test(text)) {
    temp = patti.exec(text)[0];
    time = pattnum2.exec(temp);
    time = time + ":00";

    setCurr = false;
  }
  else if (patth.test(text)) {
    temp = patth.exec(text)[0];
    time = pattnum.exec(temp);
    time = time + ":00:00";

    setCurr = false;
  }
  else if (pattk.test(text)) {
    temp = pattk.exec(text)[0];
    time = pattnum2.exec(temp);
    time = time + ":00";

    setCurr = false;
  }
  else if (pattj.test(text)) {
    temp = pattj.exec(text)[0];
    time = pattnum.exec(temp);
    time = time + ":00:00";
    console.log(temp);

    setCurr = false;
  }
  else if (pattm.test(text)) {
    temp = pattm.exec(text)[0];
    time = pattnum2.exec(temp);
    time = time + ":00";

    setCurr = false;
  }
  else if (pattl.test(text)) {
    temp = pattl.exec(text)[0];
    time = pattnum.exec(temp);
    time = time + ":00:00";

    setCurr = false;
  }
  else if (patto.test(text)) {
    temp = patto.exec(text)[0];
    time = pattnum2.exec(temp);
    time = time + ":00";

    setCurr = false;
  }
  else if (pattn.test(text)) {
    temp = pattn.exec(text)[0];
    time = pattnum.exec(temp);
    time = time + ":00:00";

    setCurr = false;
  }
  else if (pattam2.test(text)) {
    temp = pattam2.exec(text)[0];
    time = pattnum2.exec(temp);
    time = time + ":00";
    setCurr = false;
  }
  else if (pattam.test(text)) {
    temp = pattam.exec(text)[0];
    time = pattnum.exec(temp);
    time = time + ":00:00";
    setCurr = false;
  }
  else if (pattpm2.test(text)) {
    temp = pattpm2.exec(text)[0];
    time = pattnum2.exec(temp);
    time = time + ":00";
    setCurr = false;
  }
  else if (pattpm.test(text)) {
    temp = pattpm.exec(text)[0];
    time = pattnum.exec(temp);
    time = time + ":00:00";
    setCurr = false;
  }

  findAM = isam.test(text) | isam.test(subject);
  if (!setCurr)
  {
    var temp = time.split(':');
    console.log(temp[0]);
    if (temp[0] === "12") {
      temp[0] = parseInt(temp[0]) - 12;
      time = (parseInt(temp[0])) + ":" + temp[1] + ":00";
    }
    console.log(time);
    if (!findAM)
    {
      temp = time.split(':');
      time = (parseInt(temp[0]) + 12) + ":" + temp[1] + ":00";
    }
    console.log(time);
  }

  return time;
}

/**
 * parseEmail: extracts relevant information from free food event email and stores 
 * into database.
 */
var parseEmail = function(text, subject) { // - foodlist, placelist
  // Constructs current date
  var date = new Date();
  var curr_time = (date.getYear() + 1900) + '-' + (date.getMonth()+1) + '-' + date.getDate() + ' '
                   + date.getHours() + ':' + date.getMinutes() + ":" + date.getSeconds();

  // food recognition
  var food = findFood(text);
  if (subject !== null) {
    var subjfood = findFood(subject);
    if (subjfood != "")
      food = subjfood;
  }
  console.log("Final food: ");

  // location recognition
  // location in subject takes precedence over location in text
  var location = findPlace(text);
  if (subject !== null) {
    var subjlocation = findPlace(subject);
    if (subjlocation != "")
      location = subjlocation;
  }
  console.log("Final location: ");

  var lat = "";
  var longit = "";
  if (location !== "") {
    location = location.split("\t");
    var lat = Number(location[1].split(", ")[0]);
    var longit = Number(location[1].split(", ")[1]);
  }
   
  // time extraction  
  var cal = findCal(text, subject, date);

  var pattloc = new RegExp(location, "ig");
  var time = findTime(text.replace(pattloc, ""), subject, date);
  console.log("TIME IS: " + time);

  var pattapos = /\'/g;
  var pattback = /\\/g;
  text = text.replace(pattback, "\\\\");
  text = text.replace(pattapos, "\\'");

  // Inserts into database 
  if (location !== "") {
    var imagepatt = /\[image: Inline image \d?\d\]/ig;
    text = text.replace(imagepatt, "");
    pool.getConnection(function(err, connection) {
      if (err) console.log('database connection error');
      var query = 'INSERT INTO data(subject, mess, location, time, lat, longit, food) VALUES(\'' + 
                  subject + '\', \'' + text.slice(0,-1) + '\', \'' + location[0] + '\', \'' + 
                  cal + " " + time + '\', \'' + lat + '\', \'' + longit + '\', \'' + food + '\')';
      console.log(query + "\n");
      connection.query(query);
      connection.release();
    });
  }
}

exports.findFood = findFood;
exports.findPlace = findPlace;
exports.findCal = findCal;
exports.findTime = findTime;
exports.parseEmail = parseEmail;