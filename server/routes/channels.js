if (typeof define !== 'function') {
    var define = require('amdefine')(module);
}

var uuid = require('node-uuid');

define(function(require, exports, module) {
  exports.findAll = function(req, res) {
    req.app.get('db').collection('channels', function(err, collection) {
        collection.find().sort({ name: 1 }).toArray(function(err, items) {
            if(err){
                console.error(JSON.stringify(err));
                res.json({'error': err}, 500);
            }
            res.json(items);
        });
    });
  };
     
  exports.findById = function(req, res) {
      var id = req.params.id;
      // console.log('Retrieving channel: %s', id);
      req.app.get('db').collection('channels', function(err, collection) {
          collection.findOne({'_id':id}, function(err, item) {
              if(err){
                console.error(JSON.stringify(err));
                res.json({'error': err}, 500);
              }
              if(!item){
                res.json({'error': 'channel not available'}, 404);
              }
              res.json(item);
          });
      });
     
  };

  exports.addChannel = function(req, res) {
      var channel = req.body;
      channel['_id']= uuid.v4();

      // console.log('Adding channel ' + JSON.stringify(channel));
      req.app.get('db').collection('channels', function(err, collection) {
          collection.insert(channel, {safe:true}, function(err, result) {
              if (err) {
                  console.error('Error add channel: %s',err);
                  res.json({'error':'An error has occurred'}, 500);
              } else {
                  // console.log('Success: ' + JSON.stringify(result[0]));
                  res.json(result[0]);
              }
          });
      });
  };
  exports.updateChannel = function(req, res) {
      var id = req.params.id;
      var channel = req.body;
      delete channel._id;

      req.app.get('db').collection('channels', function(err, collection) {
          collection.update({'_id':id}, channel, {safe:true}, function(err, result) {
              if (err) {
                  console.error('Error updating channel: %s', err);
                  res.json({'error':'An error has occurred'}, 500);
              } else {
                  // console.log('' + result + ' document(s) updated');
                  // console.log(JSON.stringify(req.body));
                  channel._id = id;
                  res.json(channel);
              }
          });
      });
  };

  exports.deleteChannel = function(req, res) {
      var id = req.params.id;
      // console.log('Deleting channel ' + id);
      req.app.get('db').collection('channels', function(err, collection) {
          collection.remove({'_id':id}, {safe:true}, function(err, result) {
              if (err) {
                  res.json({'error':'An error has occurred - ' + err});
              }
              if(!result){
                res.json({'error': 'channel not found'}, 404);
              } 
              res.json(req.body);
          });
      });
  };
});







