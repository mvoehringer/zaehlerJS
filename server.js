/**
 * ZählerJS (https://github.com/mvoehringer/zaehlerjs)
 *
 * @file server.js
 * @author Michel Vöhringer
 */

var Http = require('http'),
    Mongo = require('mongodb'),
    Path = require('path'),
    Express =  require('express'),
    Config = require('config'),
    Socketio = require('socket.io'),
    Channels = require('./routes/channels'),
    Data = require('./routes/data');


// Initiate express
var app = Express();

// Load MongoDB
var db = new Mongo.Db(Config.ZaehlerJS.db.Name, 
                      new Mongo.Server(Config.ZaehlerJS.db.Host, 
                                       Config.ZaehlerJS.db.Port, {
                                          native_parser: false,
                                          auto_reconnect: true
                                        }),{
                          safe:false    
                      });

db.open(function(err, db) {
  if (err) {
    return console.log('\u001b[31mFailed to connect to MongoDB: ' + err + '\033[0m');
  } else {
    console.log('\u001b[32mConnect to MongoDB\033[0m');

    // Create index
    db.collection('data', function(err, collection) {
        collection.ensureIndex("medadata.date",function(data){
            console.log('\u001b[32mindex checked\033[0m');
        });
        collection.ensureIndex("medadata.channel",function(data){

        });
    });

    // Start http server
    var server = Http.createServer(app).listen(Config.ZaehlerJS.server.Port, function() {
      console.log('\u001b[32mZählerJS listening on port \u001b[33m%d\033[0m', Config.ZaehlerJS.server.Port);
    });

    // configure express server
    app.configure(function () {
      app.set('config', Config.ZaehlerJS);
      app.set('db', db);
      app.use(Express.logger('dev'));                         /* 'default', 'short', 'tiny', 'dev' */
      app.use(Express.urlencoded());
      app.use(Express.json());
      app.use(Express.compress());                            /* enable gzip compression */
      app.use(Express.static(Path.join(__dirname, 'public'))); /* serve static files */
      app.use(Express.favicon(__dirname + '/public/icon/favicon.ico')); /* add favicon */
    });
    
    //  Configure routes
    app.get('/api/channels', Channels.findAll);
    app.get('/api/channels/:id', Channels.findById);
    app.post('/api/channels', Channels.addChannel);
    app.put('/api/channels/:id', Channels.updateChannel);
    app.delete('/api/channels/:id', Channels.deleteChannel);

    app.post('/api/data/:id.json', Data.addData);
    app.post('/api/data/:id', Data.addData);
    app.post('/api/data/demo/:id', Data.addDemoData);
    app.get('/api/data/:id', Data.find);

  }
});

