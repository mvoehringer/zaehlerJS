var express = require('express'),
	channels = require('./routes/channels');
 
var app = express();

app.configure(function () {
    app.use(express.logger('dev'));     /* 'default', 'short', 'tiny', 'dev' */
    app.use(express.bodyParser());
});

app.get('/channels', channels.findAll);
app.get('/channels/:id', channels.findById);
app.post('/channels', channels.addChannel);
app.put('/channels/:id', channels.updateChannel);
app.delete('/channels/:id', channels.deleteChannel);


app.listen(3000);
console.log('Listening on port 3000...');