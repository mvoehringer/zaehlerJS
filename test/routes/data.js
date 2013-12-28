var assert = require("assert");
var config = require("config");
var request = require('supertest');
var	fixtures = require('pow-mongodb-fixtures').connect(config.ZaehlerJS.db.Name, {
  			host: config.ZaehlerJS.db.Host,
  			port: config.ZaehlerJS.db.Port 
		})

var Mongo = require('mongodb');

// test suit
suite('routes/data', function () {

	before(function (done) {
		// see https://github.com/powmedia/pow-mongodb-fixtures
		fixtures.load(__dirname + '/fixtures/channels.js', function(err){
				if (err) {
					console.error(err);
					done();
					return process.exit(-1);
				}
				done();
		});

	});

	after(function (done) {
		fixtures.clear(['channels', 'data'], function(err) {
				if (err) {
					console.error(err);
					done();
					return process.exit(-1);
				}
				fixtures.close(function(){
					done();
				});
		});
	});

	test('fixture is loaded to db', function (done) {
		// Load MongoDB
		var db = new Mongo.Db(config.ZaehlerJS.db.Name, 
		                      new Mongo.Server(config.ZaehlerJS.db.Host, 
		                                       config.ZaehlerJS.db.Port, {
		                                          native_parser: false,
		                                          auto_reconnect: true
		                                        }),{ safe:false });

		db.open(function(err, db) {
		  if (err) {
  	    return console.log('\u001b[31mFailed to connect to MongoDB: ' + err + '\033[0m');
  	    done();
	    } else {
				
				db.collection('channels', function(err, collection) {
					var cursor = collection.find().sort({ name: 1 });

					collection.count(function(err, count) {
						// Test if result is one channel
            assert.equal(1, count);
            done();

          });
				});

			};
		});
	});

	// test('find all data for channes xyz', function () {
	// 	app.get('/user', function(req, res){
	// 	  res.send(200, { name: 'tobi' });
	// 	});
	// 	console.log(app);
	// 	request(app)
	// 	  .get('/data/xyz')
	// 	  .expect('Content-Type', /json/)
	// 	  // .expect('Content-Length', '20')
	// 	  .expect(200)
	// 	  .end(function(err, res){
	// 	    if (err) throw err;
	// 	  });
	// });
});