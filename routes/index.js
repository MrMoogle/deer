/*
 * GET home page.
 */

exports.index = function(req, res){
  res.render('index', { title: 'Princeton Free Food Map' });
};

/*
exports.map = function(req, res){
  res.render('map', { title: 'Look at my map bitchez!' });
};*/