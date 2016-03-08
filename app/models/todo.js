var mongoose = require('mongoose');
var Yelp = require('yelp');

module.exports = mongoose.model('Todo', {
	text : {type : String, default: ''}
});