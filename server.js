var express = require('express');
 
var app = express();
 
app.get('/channel', function(req, res) {
    res.send([{name:'wine1'}, {name:'wine2'}]);
});

app.get('/channel/:id', function(req, res) {
    res.send({id:req.params.id, name: "The Name", description: "description"});
});
 
app.listen(3000);
console.log('Listening on port 3000...');