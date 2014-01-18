var server = require('../server');
var request = require('supertest');

describe('Start server', function() {
	var url = 'http://localhost:3001';

	before(function (done) {
		server.EventEmitter.on('serverReady',function(){
			done();
		})
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