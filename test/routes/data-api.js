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

	it('should return 500 when illegal timestamp was send',function(done){
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
		var channel = "8a3db63e-9ae0-4090-b736-d0dbbb389e11";

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

		it('one minute later, add next value to day record for '+channel,function(done){
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

		it('return 2 value for the channel for 1 year',function(done){
			request(url)
				.get('/api/data/'+ channel)
				// .send({ start: 'Manny', stop: 'cat' })
				.expect(200)
				.expect('Content-Type', /json/)
				.end(function(err,res) {
					if (err) {
						throw err;
					};
					res.body[0][0].should.equal('2014-01-18T00:00:00.000Z');
					res.body[0][1].should.equal(2);
					done();
				});
		});
	});

	describe('use volkszaehler.org api', function() {
		var timestamp = 1358624952000;
		var channel = "00000000-0000-0000-0000-000000000000";

		it('creates a new data day record for '+channel ,function(done){
			var body = {"value": 1, "date": timestamp };

			request(url)
				.post('/api/data/'+ channel +  '.json')
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

		it('creates multiple records for '+channel ,function(done){
			var body = [ [timestamp + 60 * 1000, 1],
						 [timestamp + 60 *  60 * 1000, 2], 
						 [timestamp + 2 * 60 * 60 * 1000, 3]];

			request(url)
				.post('/api/data/'+ channel +  '.json')
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

		it('return 7 as value for the channel for 1 year',function(done){
			request(url)
				.get('/api/data/'+ channel)
				.expect(200)
				.expect('Content-Type', /json/)
				.end(function(err,res) {
					if (err) {
						throw err;
					};
					res.body[0][0].should.equal('2013-01-19T00:00:00.000Z');
					res.body[0][1].should.equal(7);
					done();
				});
		});

		it('return 3 values for the channel for 1 day',function(done){
			request(url)
				.get('/api/data/'+ channel)
				.query({ start: '2013-01-19T00:00:00.000Z', 
						 end:   '2013-01-19T23:59:00.000Z' })
				.expect(200)
				.expect('Content-Type', /json/)
				.end(function(err,res) {
					if (err) {
						throw err;
					};
					res.body[0][0].should.equal('2013-01-19T19:00:00.000Z');
					res.body[0][1].should.equal(2);

					res.body[1][0].should.equal('2013-01-19T20:00:00.000Z');
					res.body[1][1].should.equal(2);

					res.body[2][0].should.equal('2013-01-19T21:00:00.000Z');
					res.body[2][1].should.equal(3);
					done();
				});
		});

		it('return 2 values for the channel for 1 hour',function(done){
			request(url)
				.get('/api/data/'+ channel)
				.query({ start: '2013-01-19T19:00:00.000Z', 
						 end:   '2013-01-19T20:00:00.000Z' })
				.expect(200)
				.expect('Content-Type', /json/)
				.end(function(err,res) {
					if (err) {
						throw err;
					};

					res.body[0][0].should.equal('2013-01-19T19:49:00.000Z');
					res.body[0][1].should.equal(1);

					res.body[1][0].should.equal('2013-01-19T19:50:00.000Z');
					res.body[1][1].should.equal(1);

					done();
				});
		});
	});

});
