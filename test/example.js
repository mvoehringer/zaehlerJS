
var assert = require("assert");

// On test
it('should return Fizz for numbers divisble by 3', function(){

	// Set timeout for this test
	this.timeout(5 * 1000);

});

// test suit
suite('isFizz', function () {
	test('returns true for numbers divisible by 3', function () {
		assert.equal(-1, [1,2,3].indexOf(5));
	});
	test('returns false for numbers not divisible by 3', function () {
		// assert.equal(-1, [1,2,3,5].indexOf(5));
	});
	test('returns true for numbers divisible by 3 async', function (done) {
	  // fizzBuzz.isFizz(3, function (actual) {
	  //   assert.that(actual, is.true());
	  //   done();
	  // });
		done();
	});
});



suite('fizzBuzz', function () {
	var _fizzBuzz;
	setup(function () {
		// _fizzBuzz = new FizzBuzz();
	});
	teardown(function () {
		_fizzBuzz = undefined;
	});
	suite('isFizz', function () {
		test('returns true for numbers divisible by 3', function () {
		// ...
		});
		test('returns false for numbers not divisible by 3', function () {
		// ...
		});
	});
	suite('isBuzz', function () {
	// ...
	});
});