// server.js

// set up ======================================================================
// get all the tools we need
var express  = require('express');
var app      = express();
var https = require('https');
var fs = require('fs');

var PORT = process.env.PORT || 8080;
var HOST = process.env.HOST || '';
var mongoose = require('mongoose');
var passport = require('passport');
var flash    = require('connect-flash');

var morgan       = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser   = require('body-parser');
var session      = require('express-session');

var configDB = require('./config/database.js');
var methodOverride = require('method-override');
var Yelp = require('yelp');
var https = require('https');




// configuration ===============================================================
mongoose.connect(configDB.url); // connect to our database

require('./config/passport')(passport); // pass passport for configuration

// set up our express application
app.use(morgan('dev')); // log every request to the console
app.use(cookieParser()); // read cookies (needed for auth)
app.use(bodyParser()); // get information from html forms

app.set('view engine', 'ejs'); // set up ejs for templating

// required for passport
app.use(session({ secret: 'ilovescotchscotchyscotchscotch' })); // session secret
app.use(passport.initialize());
app.use(passport.session()); // persistent login sessions
app.use(flash()); // use connect-flash for flash messages stored in session

app.use(express.static(__dirname + '/public')); 		// set the static files location /public/img will be /img for users
app.use(morgan('dev')); // log every request to the console
app.use(bodyParser.urlencoded({'extended':'true'})); // parse application/x-www-form-urlencoded
app.use(bodyParser.json()); // parse application/json
app.use(bodyParser.json({ type: 'application/vnd.api+json' })); // parse application/vnd.api+json as json
app.use(methodOverride('X-HTTP-Method-Override')); // override with the X-HTTP-Method-Override header in the request

// routes ======================================================================
require('./app/routes.js')(app, passport); // load our routes and pass in our app and fully configured passport

// launch ======================================================================
var options = {
    key  : fs.readFileSync('ssl/key.pem'),
    ca   : fs.readFileSync('ssl/csr.pem'),
    cert : fs.readFileSync('ssl/cert.pem')
}

https.createServer(options, app).listen(PORT, HOST, null, function() {
    console.log('Server listening on port %d in %s mode', this.address().port, app.settings.env);
});


// var yelp = new Yelp({
//   consumer_key: 'grFTF3Rp5lm-RlkHQ_WbHw',
//   consumer_secret: 'R4owE3xsHMrtu4jewQ9nQ9LDiQI',
//   token: 'viwvax3IRWW935j8jSXgcVlfezsHqZUV',
//   token_secret: 'uHb3OUy_5XfC71gjTO6Mk6swTMA',
// });
// yelp.search({ term: 'bars', location: 'Washington, DC' })
// 	.then(function (data) {
// 	  console.log(data);
// 	})
// 	.catch(function (err) {
// 	  console.error(err);
// 	});
