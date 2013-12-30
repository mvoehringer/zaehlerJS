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

    exports.preAllocateDataDocumentForDay = function(db, date){
        db.collection('channels', function(err, collection) {
            collection.find().each(function(err, item){
                if(item != null) {
                    _preAllocateDataDocument(db, item['_id'], date);
                }
            })
        });
    }

    // see http://docs.mongodb.org/ecosystem/use-cases/pre-aggregated-reports/
    _preAllocateDataDocument = function(db, channel, date){
        var day = date.getUTCDate(),
            month = date.getUTCMonth(),
            year = date.getUTCFullYear();
        var idDay = String(year) + String(month) +  String(day) + "/" + channel;

        var query = {
            '_id': idDay,
            'metadata': { 
                'date': new Date(year, month, day), 
                'channel': channel
            }
        }

        var data = {
            '_id': idDay,
            'metadata': { 
                'date': new Date(year, month, day), 
                'channel': channel
            },
            'hourly': {

            },
            'minute': {

            }
        }
        for(hour=0; hour <24;hour ++){
            data['hourly'][hour] = 0.0;
            data['minute'][hour] = {};
            for(minute=0;minute < 60;  minute++){
                data['minute'][hour][minute] = 0.0;
            }
        }
        return _updateDocument(db, query, data);
    }

    _updateDocument = function(db, query, data){
        // Update daily statisics 
        db.collection('data', function(err, collection) {
            collection.update(query, data, {upsert:true, safe:true}, function(err, result) {
                if (err) {
                    console.log('Error updating channel: ' + err);
                    // TODO set 500 header here
                    return ({'error':'An error has occurred'});
                } else {
                    console.log('' + result + ' document(s) updated');
                    return(true);
                }
            });
        });
    }

    _addData = function(db, channel, value, date){
        var minute = date.getUTCMinutes(),
            hour = date.getUTCHours();
            day = date.getUTCDate(),
            month = date.getUTCMonth(),
            year = date.getUTCFullYear();
        var idDay = String(year) + String(month) +  String(day) + "/" + channel;

        var query = {
            '_id': idDay
        };
        var update = {};
        update['$inc'] = {};
        update['$inc']['hourly.'+String(hour)] = value;
        update['$inc']['minute.'+String(hour)+"."+String(minute)] = value;

        return _updateDocument(db, query, update);
    }

    exports.addData = function(req, res) {
        console.log(req.params.id);
        res.send(_addData(req.app.get('db'), 
                        req.params.id, 
                        req.body["value"], 
                        new Date()));
    }

    exports.addDemoData = function(req, res) {
        var endDate = new Date(); // NOW
        var actualDate = new Date();        // Now - 1year
        actualDate.setYear(endDate.getFullYear() - 1 );

        while (actualDate <= endDate){
            // console.log("actualDate Date: " + actualDate);
            _addData(req.app.get('db'), 
                req.params.id, 
                Math.floor(Math.random() * 16) + 1  , 
                actualDate);
            actualDate.setUTCHours(actualDate.getUTCHours() + 1); // + 1 hour
        };
        res.send(true);
    }

});

