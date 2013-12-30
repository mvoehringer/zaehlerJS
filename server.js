/**
 * ZählerJS (https://github.com/mvoehringer/zaehlerjs)
 *
 * @file server.js
 * @author Michel Vöhringer
 */

/**
 * RequireJS
 * @see http://requirejs.org/docs/node.html
 */
var requirejs = require('requirejs');
requirejs.config({
  nodeRequire: require
});

/**
 * Express
 * @see http://expressjs.com/guide.html
 */
requirejs([ 'http', 
            'mongodb', 
            'path', 
            'express', 
            'config',
            'socket.io', 
            './routes/channels',
            './routes/data' 
            ], 

            function(Http,
                    Mongo, 
                    Path, 
                    Express, 
                    Config,
                    Socketio, 
                    Channels,
                    Data){

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

      // Add indices to collections
      db.collectionNames(function (err, list) {      

        var dbname           = Config.ZaehlerJS.db.Name;
        var collectoinPrefix = dbname + "." + Config.ZaehlerJS.db.DataCollectionPrefix;

        list.forEach(function(item){
            if (item.name.substring(0, collectoinPrefix.length) == collectoinPrefix) {
                var collectionName = item.name.substring(dbname.length + 1);
                db.collection(collectionName, function(err, collection) {
                    collection.ensureIndex("date",function(data){
                        console.log('\u001b[32mindex checked\033[0m');
                    });
                });
            }
        })
      });

      /*
        Pre create document 
      */
      // Create Documents for today
      Data.preAllocateDataDocumentForDay(db, new Date());
      // Document for tomorrow
      Data.preAllocateDataDocumentForDay(db, new Date(new Date().getTime() + 24 * 60 * 60 * 1000));
      setInterval(function(){
        console.log("create new Documents for next day");
        Data.preAllocateDataDocumentForDay(db, new Date());
      }, 24*60*60*1000);
      

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
      app.get('/channels', Channels.findAll);
      app.get('/channels/:id', Channels.findById);
      app.post('/channels', Channels.addChannel);
      app.put('/channels/:id', Channels.updateChannel);
      app.delete('/channels/:id', Channels.deleteChannel);

      app.post('/data/:id', Data.addData);
      app.post('/data/demo/:id', Data.addDemoData);
      app.get('/data/:id', Data.find);

    }
  });
});

