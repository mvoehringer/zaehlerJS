
var CONFIG = require('config').ZaehlerJS;
var BSON = require('mongodb').BSONPure;


exports.findAll = function(req, res) {
    db.collection('channels', function(err, collection) {
        collection.find().toArray(function(err, items) {
            res.send(items);
        });
    });
};
 
exports.findById = function(req, res) {
    var id = req.params.id;
    console.log('Retrieving channels: ' + id);
    db.collection('channels', function(err, collection) {
        collection.findOne({'_id':new BSON.ObjectID(id)}, function(err, item) {
            res.send(item);
        });
    });
};

exports.addChannel = function(req, res) {
    var channel = req.body;
    console.log('Adding channel ' + JSON.stringify(channel));
    db.collection('channels', function(err, collection) {
        collection.insert(channel, {safe:true}, function(err, result) {
            if (err) {
                res.send({'error':'An error has occurred'});
            } else {
                console.log('Success: ' + JSON.stringify(result[0]));
                res.send(result[0]);
            }
        });
    });
}

exports.updateChannel = function(req, res) {
    var id = req.params.id;
    var channel = req.body;
    delete channel._id;
    console.log('Updating channel: ' + id);
    console.log(JSON.stringify(channel));

    db.collection('channels', function(err, collection) {
        collection.update({'_id':new BSON.ObjectID(id)}, channel, {safe:true}, function(err, result) {
            if (err) {
                console.log('Error updating channel: ' + err);
                res.send({'error':'An error has occurred'});
            } else {
                console.log('' + result + ' document(s) updated');
                res.send(channel);
            }
        });
    });
}


exports.deleteChannel = function(req, res) {
    var id = req.params.id;
    console.log('Deleting channel ' + id);
    db.collection('channels', function(err, collection) {
        collection.remove({'_id':new BSON.ObjectID(id)}, {safe:true}, function(err, result) {
            if (err) {
                res.send({'error':'An error has occurred - ' + err});
            } else {
                console.log('' + result + ' document(s) deleted');
                res.send(req.body);
            }
        });
    });
}

/*--------------------------------------------------------------------------------------------------------------------*/
// Populate database with sample data -- Only used once: the first time the application is started.
// You'd typically not find this code in a real-life app, since the database would already exist.
var populateDB = function() {
 
    var channels = [
    {
        name: "Electricity",
        description: "Electricity at home"
    },
    {
        name: "Water",
        description: "water at home"
    }];
 
    db.collection('channels', function(err, collection) {
        collection.insert(channels, {safe:true}, function(err, result) {});
    });
 
};

