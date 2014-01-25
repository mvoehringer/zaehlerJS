process.env.NODE_ENV = 'test';

var app = require('../server');
var request = require('supertest');
var Http = require('http');


describe('Start server', function() {
	var url = 'http://localhost:3001';
	var server;

	before(function (done) {
		this.server = Http.createServer(app).listen(3001, function() {
			done();
		});
    });
    after(function(done) {
    	this.server.close(done);
  	});
    			
	it('GET / should return 200 ',function(done){
		request(url)
			.get('/')
			.expect(200, done);
	});

	it('GET /favicon.ico should return 200 ',function(done){
		request(url)
			.get('/favicon.ico')
			.expect(200, done);
	});

	it('GET /css/default.css should return 200 ',function(done){
		request(url)
			.get('/css/default.css')
			.expect(200, done);
	});

	it('GET /404 should return 404 ',function(done){
		request(url)
			.get('/404')
			.expect(404, done);
	});

})