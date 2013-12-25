// var socket = io.connect();
// socket.on('news', function(data) {
// 	console.log(data);
// });


var news = io.connect('http://localhost/news');

news.on('news', function () {
	news.emit('woot');
});