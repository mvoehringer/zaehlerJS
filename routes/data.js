
var CONFIG = require('config').Volkszaehler;

/*
@param start startdate for filter
@param end enddate for filter
*/
exports.find = function(req, res) {
    var channelId = req.params.id;
    var start = req.query.start ? new Date(req.query.start) : null;
    var end = req.query.end ? new Date(req.query.end) : null;
    var filter = {};
    var aggregationFields = {'_id': false};

    if (start && end) {
        filter = { $and: [{ "date": { $gte: start} }, { "date": { $lt: end}}] };
    }

    db.collection( CONFIG.db.DataCollectionPrefix + channelId, function(err, collection) {
        collection.find(filter, aggregationFields).toArray(function(err, items) {
            console.log(items);
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



