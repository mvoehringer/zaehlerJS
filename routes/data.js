define(function(require, exports, module) {
  /*
  @param start startdate for filter
  @param end enddate for filter
  */
  exports.find = function(req, res) {
      var channelId = req.params.id,
          start     = req.query.start ? new Date(req.query.start) : null,
          end       = req.query.end ? new Date(req.query.end) : null,
          limit     = req.query.limit ? parseInt(req.query.limit) : 500,
          filter    = {},
          aggregationFields = {'_id': false},
          config = req.app.get('config');
      
      if (start && end) {
          filter = { $and: [{ "date": { $gte: start} }, { "date": { $lt: end}}] };
      }

      req.app.get('db').collection( config.db.DataCollectionPrefix + channelId, function(err, collection) {
          var itemsArray = [];
          var cursor = collection.find(filter, aggregationFields).sort( { date: 1 } ).limit(limit);
          cursor.each(function(err, item) {
              // If the item is null then the cursor is exhausted/empty and closed
              if(item == null) {
                 res.send(itemsArray);
              }else{
                  itemsArray.push( [item['date'].toJSON(), item['value']]);
              }
          });
      });
  };


  _addData = function(db, channelCollection, value, date){
      var data =  new Object();
      data["date"] = date;
      data["value"] = value;

      // console.log('Adding data ' + JSON.stringify(data));

      db.collection(channelCollection, function(err, collection) {
          collection.insert(data, {safe:true}, function(err, result) {
              if (err) {
                  res.send({'error':'An error has occurred'});
              } else {
                  // console.log('Success: ' + JSON.stringify(result[0]));
                  return result[0];
              }
          });
      });
  }

  exports.addData = function(req, res) {
      res.send(_addData(req.app.get('db'), 
                        req.app.get('config').db.DataCollectionPrefix + req.params.id, 
                        req.body["value"], 
                        new Date()));
  }

  exports.addDemoData = function(req, res) {
      var endDate = new Date(); // NOW
      var actualDate = new Date();        // Now - 1year
      actualDate.setYear(endDate.getFullYear() - 1 );

      // console.log("end Date: " + endDate);

      while (actualDate <= endDate){
          // console.log("actualDate Date: " + actualDate);
          _addData(req.app.get('db'), 
                req.app.get('config').db.DataCollectionPrefix + req.params.id, 
                Math.floor(Math.random() * 16) + 1  , 
                actualDate);
          actualDate.setUTCHours(actualDate.getUTCHours() + 1); // + 1 hour
      }
      res.send(true);
  }

});

