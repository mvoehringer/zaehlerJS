var express = require('express'),
    path = require('path'),
    http = require('http'),
    CONFIG = require('config').Customer,
	channels = require('./routes/channels');
 
var app = express();


app.configure(function () {
	app.set('port', CONFIG.server.Port);
    app.use(express.logger('dev'));     /* 'default', 'short', 'tiny', 'dev' */
    app.use(express.bodyParser());
    app.use(express.compress()); 		/* enable gzip compression */
    app.use(express.static(path.join(__dirname, 'public'))); /* serve static files */
});

app.get('/channels', channels.findAll);
app.get('/channels/:id', channels.findById);
app.post('/channels', channels.addChannel);
app.put('/channels/:id', channels.updateChannel);
app.delete('/channels/:id', channels.deleteChannel);


http.createServer(app).listen(app.get('port'), function () {
    console.log("Express server listening on port " + app.get('port'));
});
