var express = require('express'),
    path = require('path'),
    http = require('http'),
    CONFIG = require('config').ZaehlerJS,
	channels = require('./routes/channels'),
	data = require('./routes/data');
 
/*
Connect to MongoDB
*/
var mongo = require('mongodb');
var Server = mongo.Server,
    Db = mongo.Db;
 
var server = new Server(CONFIG.db.Host, CONFIG.db.Port, {auto_reconnect: true});
db = new Db(CONFIG.db.Name, server, {safe:false});
 
db.open(function(err, db) {
    if(!err) {
        console.log("Connected to '" + CONFIG.db.Name + "' database");
        db.collection('channels', {strict:true}, function(err, collection) {
            if (err) {
                console.log("The 'channels' collection doesn't exist. Creating it with sample data...");
                populateDB();
            }
        });
    }
});

/* 
 * Setup server
*/
var app = express();

app.configure(function () {
	app.set('port', CONFIG.server.Port);
    app.use(express.logger('dev'));     /* 'default', 'short', 'tiny', 'dev' */
    app.use(express.urlencoded());
    app.use(express.json());
    app.use(express.compress()); 		/* enable gzip compression */
    app.use(express.static(path.join(__dirname, 'public'))); /* serve static files */
});


/*
 * Configure routes
*/
app.get('/channels', channels.findAll);
app.get('/channels/:id', channels.findById);
app.post('/channels', channels.addChannel);
app.put('/channels/:id', channels.updateChannel);
app.delete('/channels/:id', channels.deleteChannel);

app.post('/data/:id', data.addData);
app.post('/data/demo/:id', data.addDemoData);
app.get('/data/:id', data.find);

/*
* Start server
*/
http.createServer(app).listen(app.get('port'), function () {
    console.log("Express server listening on port " + app.get('port'));
});
