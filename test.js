var fs          = require('fs');
var foodlist = fs.readFileSync('./public/text/food.txt').toString().split("\n");
console.log(foodlist[0].charCodeAt(8));
console.log("eggplant".charCodeAt(8));
console.log(foodlist[0]);