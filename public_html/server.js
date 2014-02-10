"use strict";
var mongoose = require('mongoose'), http = require('http'), url = require('url'), fs = require('fs'),
        mime = require('mime'), express = require('express'), passport = require('passport'),
        port = process.env.PORT || 8080, flash = require('connect-flash');
var app = express(), server = http.createServer(app), io = require('socket.io').listen(server, {log: false}), db = null, ImgSchema = null, Img = null;

initDB();
createServerNew();
listen();

function listen() {
    db.once('open', function() {
        console.log('Connected to DB');
        server.listen(port);
        console.log('Server listening at http://localhost:' + port + '/');
        io.sockets.on('connection', function(socket) {
            socket.on('retrieve', function(msg) {
                retrieve(msg.find, msg.sort, function(data) {
                    socket.emit('data', data);
                });
            });
            socket.on('retrieveList', function(query) {
                retrieve(query.query, query.sort, function(data) {
                    socket.emit('dataList', data);
                });
            });
            socket.on('edit', function(msg) {
                edit(msg.find, msg.replace, function() {
                    socket.emit('updated');
                });
            });
        });
    });
}

function retrieve(and, sort, callback) {
    Img.find().and(and).sort(sort).exec(function(err, imgs) {
        if (err | !imgs) {
            console.log('DB Read Error');
            return;
        }
        callback(imgs);
    });
}

function edit(find, replace, callback) {
    Img.update(find, replace, function(err) {
        if (err) {
            console.log('DB Read Error');
            return;
        }
        callback();
    });
}

function initDB() {
    mongoose.connect('mongodb://localhost/data');
    db = mongoose.connection;
    db.on('error', function() {
        console.log("Couldn't connect to Database");
        process.exit();
    });
    ImgSchema = new mongoose.Schema({}, {strict: false});
    Img = mongoose.model('composites', ImgSchema);

    require('./config/passport')(passport); // pass passport for configuration
}

function createServer() {
    server = http.createServer(function(req, res) {
        var urlStr = url.parse(req.url).pathname;
        if (urlStr === '/')
            urlStr = '/homePage.html';
        try {
            res.writeHead(200, {'content-type': mime.lookup('.' + urlStr), 'Access-Control-Allow-Origin': '*'});
            res.end(fs.readFileSync("." + urlStr));
        } catch (e) {
            res.writeHead(404, {'content-type': 'text/plain'});
            res.end('Looks like you\'ve encountered a 404 error.');
        }
    });
}

function createServerNew() {
    app.configure(function() {
        // set up our express application
        app.use(express.logger('dev')); // log every request to the console
        app.use(express.cookieParser()); // read cookies (needed for auth)
        app.use(express.bodyParser()); // get information from html forms

        app.set('view engine', 'ejs'); // set up ejs for templating

        // required for passport
        app.use(express.session({secret: 'aware'})); // session secret
        app.use(passport.initialize());
        app.use(passport.session()); // persistent login sessions
        app.use(flash()); // use connect-flash for flash messages stored in session
    });
    
    app.all('*', function(req, res, next) {
        res.header("Access-Control-Allow-Origin", "*");
        res.header("Access-Control-Allow-Headers", "X-Requested-With");
        next();
    });

    app.get('/', function(req, res) {
        res.sendfile('./homePage.html');
    });
    app.get('/loginmain', function(req, res) {
        res.render('index.ejs'); // load the index.ejs file
    });
    // =====================================
    // LOGIN ===============================
    // =====================================
    // show the login form
    app.get('/login', function(req, res) {
        // render the page and pass in any flash data if it exists
        res.render('login.ejs', {message: req.flash('loginMessage')});
    });

    // process the login form
    app.post('/login', passport.authenticate('local-login', {
        successRedirect: '/homePage.html', // redirect to the secure profile section
        failureRedirect: '/login', // redirect back to the signup page if there is an error
        failureFlash: true // allow flash messages
    }));

    // =====================================
    // SIGNUP ==============================
    // =====================================
    // show the signup form
    app.get('/signup', function(req, res) {
        // render the page and pass in any flash data if it exists
        res.render('signup.ejs', {message: req.flash('signupMessage')});
    });

    // process the signup form
    app.post('/signup', passport.authenticate('local-signup', {
        successRedirect: '/loginmain', // redirect to the secure profile section
        failureRedirect: '/signup', // redirect back to the signup page if there is an error
        failureFlash: true // allow flash messages
    }));

    // =====================================
    // PROFILE SECTION =====================
    // =====================================
    // we will want this protected so you have to be logged in to visit
    // we will use route middleware to verify this (the isLoggedIn function)
    app.get('/profile', isLoggedIn, function(req, res) {
        res.render('profile.ejs', {
            user: req.user // get the user out of session and pass to template
        });
    });

    // =====================================
    // LOGOUT ==============================
    // =====================================
    app.get('/logout', function(req, res) {
        req.logout();
        res.redirect('/');
    });

    app.all('*', function(req, res) {
        res.sendfile('.' + url.parse(req.url).pathname);
    });
}
// route middleware to make sure a user is logged in
function isLoggedIn(req, res, next) {

    // if user is authenticated in the session, carry on 
    if (req.isAuthenticated())
        return next();

    // if they aren't redirect them to the home page
    res.redirect('/');
}