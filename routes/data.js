if (typeof define !== 'function') {
    var define = require('amdefine')(module);
}
var BSON = require('mongodb').BSONPure;

Date.prototype.addHours= function(h){
    this.setHours(this.getHours()+h);
    return this;
}

Date.prototype.addMinutes= function(m){
    this.setMinutes(this.getMinutes()+m);
    return this;
}
define(function(require, exports, module) {
    /*
    @param start startdate for filter
    @param end enddate for filter
    */
    exports.find = function(req, res) {
        var channelId = req.params.id,
            start     = req.query['start'] ? new Date(req.query['start']) : null,
            end       = req.query['end'] ? new Date(req.query['end']) : null,
            limit     = req.query.limit ? parseInt(req.query.limit) : 500,
            filter    = {'metadata.channel': new BSON.ObjectID(channelId)},
            db        = req.app.get('db'),
            aggregationFields = {},
            getDataFrom = 'minute';


        if (start && end) {
            filter = { $and: [
                { 'metadata.date': { $gte: start} }, { 'metadata.date': { $lt: end}}] };

            if(end - start <= limit * 60 * 100 ){
                // on item per miunte
                getDataFrom = 'minute';
            }else if(end - start <= limit * 60 * 60 * 100 ){
                // on item per houre
                getDataFrom = 'hour';
            }
        }

        console.log(filter);
        db.collection('data', function(err, collection) {
            var itemsArray = [];
            var cursor = collection.find(filter, aggregationFields).sort( { date: 1 } );

            // console.log(JSON.stringify(filter));
            // console.log("search data");

            cursor.each(function(err, item) {
                // If the item is null then the cursor is exhausted/empty and closed
                if(item == null) {
                    res.send(itemsArray);
                }else{
                    // console.log(item['hourly']);
                    // var itemValue;
                    switch(getDataFrom){
                        case 'hour': 
                            Object.keys(item['hourly']).forEach(function(hour){
                                var date = new Date(item['metadata']['date']).addHours(hour);
                                var value = item['hourly'][hour];
                                if(value){
                                    itemsArray.push( [date.toJSON(), value]);
                                }
                            }); 
                        case 'minute': 
                            // console.log(item['minute']);
                            Object.keys(item['minute']).forEach(function(hour){
                                // console.log(item['minute'][hour]);
                                Object.keys(item['minute'][hour]).forEach(function(minute) {
                                    var date = new Date(item['metadata']['date']).addHours(hour).addMinutes(minute);
                                    var value = item['minute'][hour][minute];
                                    // console.log(value);
                                    if(value){
                                        itemsArray.push( [date.toJSON(), value]);
                                    }
                                })
                            }); 
                    }
                    
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

    exports.addData = function(req, res) {
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
            'day': 0,
            'hourly': {},
            'minute': {}
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
                    // console.log('' + result + ' document(s) updated');
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
        update['$inc']['day'] = value;
        update['$inc']['hourly.'+String(hour)] = value;
        update['$inc']['minute.'+String(hour)+"."+String(minute)] = value;

        return _updateDocument(db, query, update);
    }
});

