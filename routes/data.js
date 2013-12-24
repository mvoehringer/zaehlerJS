
var CONFIG = require('config').Volkszaehler;

exports.findAll = function(req, res) {
    var channelId = req.params.id;

    db.collection( CONFIG.db.DataCollectionPrefix + channelId, function(err, collection) {
        collection.find().toArray(function(err, items) {
            res.send(items);
        });
    });
};


exports.addData = function(req, res) {
    var data =  new Object();
    var channelId = req.params.id;

    data["date"] = new Date();
    data["value"] = req.body["value"];

    console.log('Adding data ' + JSON.stringify(data));

    // TODO: check if channel exists
    db.collection( CONFIG.db.DataCollectionPrefix + channelId, function(err, collection) {
        collection.insert(data, {safe:true}, function(err, result) {
            if (err) {
                res.send({'error':'An error has occurred'});
            } else {
                console.log('Success: ' + JSON.stringify(result[0]));
                res.send(result[0]);
            }
        });
    });
}



