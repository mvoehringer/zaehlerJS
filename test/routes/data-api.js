var server = require('../../server');
var should = require('should');
var request = require('supertest'); 
var config = require("config");
var fixtures = require('pow-mongodb-fixtures').connect(config.ZaehlerJS.db.Name, {
            host: config.ZaehlerJS.db.Host,
            port: config.ZaehlerJS.db.Port 
        })

describe('Data API', function() {
	var url = 'http://localhost:3001';
	
    before(function (done) {
        // see https://github.com/powmedia/pow-mongodb-fixtures
        fixtures.clearAllAndLoad(__dirname + '/fixtures/', function(err){
            if (err) {
                console.error(err);
                done();
                return process.exit(-1);
            }
            done();
        });
    });
    
    after(function (done) {
		fixtures.clear(['channels','data'], function(err) {
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

	it('GET /api/data/unknownchannel should return 404',function(done){
		request(url)
			.get('/api/data/unknownchannel')
			.expect(404)
			.expect('Content-Type', /json/)
			.end(function(err,res) {
				if (err) {
					throw err;
				}
				res.body.error.should.equal('channel not found');
				done();
			});
	});

	it('POST /api/data/unknownchannel should return 404',function(done){
		request(url)
			.get('/api/data/unknownchannel')
			.expect(404)
			.expect('Content-Type', /json/)
			.end(function(err,res) {
				if (err) {
					throw err;
				}
				res.body.error.should.equal('channel not found');
				done();
			});
	});

	it('should return 500 when wrong timestamp is send',function(done){
		var body = {value :  1, date : 'wrong timestamp' };
		request(url)
			.post('/api/data/7a3db63e-9ae0-4090-b736-d0dbbb389e10')
			.send(body)
			.expect(500)
			.expect('Content-Type', /json/)
			.end(function(err,res) {
				if (err) {
					throw err;
				}
				res.body.error.should.equal('wrong timestamp');
				done();
			});
	});

	describe('create and update', function() {
		var timestamp = 1390084776000;

		var channel = "7a3db63e-9ae0-4090-b736-d0dbbb389e10";

		it('creates a new data day record for '+channel+' add new data to the channel',function(done){
			var body = {"value": 1, "date": timestamp };

			request(url)
				.post('/api/data/'+ channel )
				.send(body)
				.expect(200)
				.expect('Content-Type', /json/)
				.end(function(err,res) {
					if (err) {
						throw err;
					}
					res.body.should.equal('true');
					done();
				});
		});

		it('one minite later, add next value to day record for '+channel,function(done){
			var body = {"value": 1, 
						"date": timestamp + 60 * 1000 };

			request(url)
				.post('/api/data/'+ channel )
				.send(body)
				.expect(200)
				.expect('Content-Type', /json/)
				.end(function(err,res) {
					if (err) {
						throw err;
					}
					res.body.should.equal('true');
					done();
				});
		});

		// it('return 2 as count and value for the channel for 1 year',function(done){
	
		// 	request(url)
		// 		.get('/api/data/'+ channel)
		// 		// .send({ start: 'Manny', stop: 'cat' })
		// 		.expect(200)
		// 		.expect('Content-Type', /json/)
		// 		.end(function(err,res) {
		// 			if (err) {
		// 				throw err;
		// 			}
		// 			res.body.should.equal('true');
		// 			done();
		// 		});
		// });
	});
});
