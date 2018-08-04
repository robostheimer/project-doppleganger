// app/routes.js

var Todo = require('./models/todo');
var Yelp = require('yelpv3')
var yelp = new Yelp();
var apiKey = 'GVOHt9AqIn5o8GUQsl54CUXp13GbHW58f7xCbsyyxwdYH713DdLzokdGdMjXRbr5jsvnL9C_Tt3Bu0RvAGNXR_G4SBSuWABtubWuzbg9uh-ETCfIgtMflK55MmxjW3Yx';

function getTodos(res){
    Todo.find(function(err, todos) {

            // if there is an error retrieving, send the error. nothing after res.send(err) will execute
            if (err)
                res.send(err)

            res.json(todos); // return all todos in JSON format
        });
};

module.exports = function(app, passport) {
    // =====================================
    // CORS ================================
    // =====================================

    app.use(function(req, res, next) {
      res.header("Access-Control-Allow-Origin", "*");
      res.header("Access-Control-Allow-Headers", "X-Requested-With");
      next();
    });

    // =====================================
    // HOME PAGE (with login links) ========
    // =====================================
    // app.get('/', function(req, res) {
    //     res.render('index.ejs'); // load the index.ejs file
    // });

    //TODO add items to users profiles and add login
    app.get('/', function(req, res) {
        res.render('search.ejs'); // load the index.ejs file
    });
    
    // =====================================
    // LOGIN ===============================
    // =====================================
    // show the login form
    app.get('/login', function(req, res) {

        // render the page and pass in any flash data if it exists
        res.render('login.ejs', { message: req.flash('loginMessage') }); 
    });

    // process the login form
    app.post('/login', passport.authenticate('local-login', {
        successRedirect : '/search', // redirect to the secure profile section
        failureRedirect : '/login', // redirect back to the signup page if there is an error
        failureFlash : true // allow flash messages
    }));

    // =====================================
    // SIGNUP ==============================
    // =====================================
    // show the signup form
    app.get('/signup', function(req, res) {

        // render the page and pass in any flash data if it exists
        res.render('signup.ejs', { message: req.flash('signupMessage') });
    });

    // process the signup form
    app.post('/signup', passport.authenticate('local-signup', {
        successRedirect : '/profile', // redirect to the secure profile section
        failureRedirect : '/signup', // redirect back to the signup page if there is an error
        failureFlash : true // allow flash messages
    }));

    // =====================================
    // PROFILE SECTION =====================
    // =====================================
    // we will want this protected so you have to be logged in to visit
    // we will use route middleware to verify this (the isLoggedIn function)
    app.get('/profile', isLoggedIn, function(req, res) {
        res.render('profile.ejs', {
            user : req.user // get the user out of session and pass to template
        });
    });

    // =====================================
    // LOGOUT ==============================
    // =====================================
    app.get('/logout', function(req, res) {
        req.logout();
        res.redirect('/');
    });

    // =====================================
    // TODOS ===============================
    // =====================================
    app.get('/search', isLoggedIn, function(req, res) {
        res.render('search.ejs', {
            user : req.user // get the user out of session and pass to template
        });
    });


    // =====================================
    // YELP API=============================
    // =====================================

    app.get('/api/yelp/search', function(req, res) {
         yelp.search({ term: req.query.term, location: req.query.location, latitude: req.query.lat,  longitude: req.query.lng, limit: 10, token: apiKey })
            .then(function (data) {
                res.send(data);
            })
            .catch(function (err) {
                res.send(err.error);
            });
    });

     app.get('/api/yelp/business', function(req, res){
        yelp.business({id: req.query.id, token: apiKey})
          .then(function(data){
            res.send(data);
          })
     })

    // =====================================
    // TODOS API==============================
    // =====================================

    app.get('/api/todos', function(req, res) {

        // use mongoose to get all todos in the database
        getTodos(res);
    });

    

    // create todo and send back all todos after creation
    app.post('/api/todos', function(req, res) {

        // create a todo, information comes from AJAX request from Angular
        Todo.create({
            text : req.body.text,
            done : false
        }, function(err, todo) {
            if (err)
                res.send(err);

            // get and return all the todos after you create another
            getTodos(res);
        });

    });

    // delete a todo
    app.delete('/api/todos/:todo_id', function(req, res) {
        Todo.remove({
            _id : req.params.todo_id
        }, function(err, todo) {
            if (err)
                res.send(err);

            getTodos(res);
        });
    });

    // application -------------------------------------------------------------
    
};

// route middleware to make sure a user is logged in
function isLoggedIn(req, res, next) {

    // if user is authenticated in the session, carry on 
    if (req.isAuthenticated())
        return next();

    // if they aren't redirect them to the home page
    res.redirect('/');
}