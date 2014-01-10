var mongoose = require('mongoose'), http = require('http'), url = require('url'), fs = require('fs'),
        sio = require('socket.io'), mime = require('mime');
var db, server, ImgSchema, Img;

initDB();
createServer();
listen();

function listen() {
    db.once('open', function() {
        console.log('Connected to DB');
        server.listen(8080, function() {
            console.log('Server listening at http://localhost:8080/');
        });
        io = sio.listen(server, {log: false});
        io.sockets.on('connection', function(socket) {
            socket.on('retrieve', function(msg) {
                retrieve(msg.find, msg.sort, function(data) {
                    socket.emit('data', data);
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

function retrieve(find, sort, callback) {
    Img.find(find).sort(sort).exec(function(err, imgs) {
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
}

function createServer() {
    server = http.createServer(function(req, res) {
        var urlStr = url.parse(req.url).pathname;
        if (urlStr === '/') {
            res.writeHead(200, {'content-type': mime.lookup('./index.html')});
            res.end(fs.readFileSync('./index.html'));
        } else {
            try {
                res.writeHead(200, {'content-type': mime.lookup('.' + urlStr)});
                res.end(fs.readFileSync("." + urlStr));
            } catch (e) {
                res.writeHead(404, {'content-type': 'text/plain'});
                res.end('Looks like you\'ve encountered a 404 error.');
            }
        }
    });
}