var app = require('../../server');
var should = require('should');
var request = require('supertest'); 
var config = require("config");
var Http = require('http');
var fixtures = require('pow-mongodb-fixtures').connect(config.ZaehlerJS.db.Name, {
            host: config.ZaehlerJS.db.Host,
            port: config.ZaehlerJS.db.Port 
        })

describe('Channels API', function() {
	var url = 'http://localhost:3001';
	
    before(function (done) {
        // see https://github.com/powmedia/pow-mongodb-fixtures
        fixtures.load(__dirname + '/fixtures/channels.js', function(err){
            if (err) {
                console.error(err);
                done();
                return process.exit(-1);
            }
			this.server = Http.createServer(app).listen(3001, function() {
				done();
			});
        });
    });
    
    after(function (done) {
        fixtures.clear(['channels'], function(err) {
            if (err) {
                console.error(err);
                done();
                return process.exit(-1);
            }
            fixtures.close(function(){
            	this.server.close(done);
            });
        });
    });

	it('GET /api/channels/7a3db63e-9ae0-4090-b736-d0dbbb389e10 should return the details for channel 7a3db63e-9ae0-4090-b736-d0dbbb389e10',function(done){
		request(url)
			.get('/api/channels/7a3db63e-9ae0-4090-b736-d0dbbb389e10')
			.expect(200)
			.expect('Content-Type', /json/)
			.end(function(err,res) {
				if (err) {
					throw err;
				}
				res.body.should.have.property('_id');
				res.body._id.should.equal('7a3db63e-9ae0-4090-b736-d0dbbb389e10');
				res.body.name.should.equal('Channel 1');
				res.body.kind.should.equal('impulse');
				res.body.resolution.should.equal('10000');
				res.body.unit.should.equal('energy');
				res.body.description.should.equal('description channel 1');
				done();
			});
	});

	it('GET /api/channels should return a channel list',function(done){
		request(url)
			.get('/api/channels')
			.expect('Content-Type', /json/)
			.expect(200)
			.end(function(err,res) {
				if (err) {
					throw err;
				}
				res.body[0].should.have.property('_id');
				res.body[0]._id.should.equal('7a3db63e-9ae0-4090-b736-d0dbbb389e10');
				res.body[0].name.should.equal('Channel 1');
				res.body[0].description.should.equal('description channel 1');
				done();
			});
	});

	it('GET /api/channels/unknownchannel should return 404',function(done){
		request(url)
			.get('/api/channels/unknownchannel')
			.expect(404)
			.expect('Content-Type', /json/)
			.end(function(err,res) {
				if (err) {
					throw err;
				}
				res.body.error.should.equal('channel not available');
				done();
			});
	});

	it('POST /api/channels should create new channel',function(done){
		var body = {
			name: 'New Channel',
			kind: 'impulse',
			resolution: '10000',
			unit: 'energy',
			description: 'description New Channel'
		};
		request(url)
			.post('/api/channels')
			.send(body)
			.expect(200)
			.expect('Content-Type', /json/)
			.end(function(err,res) {
				if (err) {
					throw err;
				}
				res.body.should.have.property('_id');
				res.body.name.should.equal('New Channel');
				res.body.kind.should.equal('impulse');
				res.body.resolution.should.equal('10000');
				res.body.unit.should.equal('energy');
				res.body.description.should.equal('description New Channel');
				done();
			});
	});

	it('PUT /api/channels/8a3db63e-9ae0-4090-b736-d0dbbb389e11 should update channel 2',function(done){
		var body = {
			name: 'Channel 2 new name',
			kind: 'impulse',
			resolution: '10',
			unit: 'energy',      
			description: 'new description channel 2'
		};
		request(url)
			.put('/api/channels/8a3db63e-9ae0-4090-b736-d0dbbb389e11')
			.send(body)
			.expect(200)
			.expect('Content-Type', /json/)
			.end(function(err,res) {
				if (err) {
					throw err;
				}
				res.body.should.have.property('_id');
				res.body._id.should.equal('8a3db63e-9ae0-4090-b736-d0dbbb389e11');
				res.body.name.should.equal('Channel 2 new name');
				res.body.kind.should.equal('impulse');
				res.body.resolution.should.equal('10');
				res.body.unit.should.equal('energy');
				res.body.description.should.equal('new description channel 2');
				done();
			});
	});

	it('DELETE /api/channels/7a3db63e-9ae0-4090-b736-d0dbbb389e10 should delete the channels',function(done){
		request(url)
			.del('/api/channels/7a3db63e-9ae0-4090-b736-d0dbbb389e10')
			.expect(200)
			.end(function(err,res){
				done();
			});
	});

	it('DELETE /api/channels/unknownchannel should return 404',function(done){
		request(url)
			.del('/api/channels/unknownchannel')
			.expect(404)
			.end(function(err,res){
				done();
			});
	});
});
