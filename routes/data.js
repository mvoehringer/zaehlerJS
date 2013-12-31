if (typeof define !== 'function') {
    var define = require('amdefine')(module);
}
var BSON = require('mongodb').BSONPure;
var async = require('async');


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
            filter    = {  
                        $and: [
                            {'metadata.channel': channelId }
                        ]},
            db        = req.app.get('db'),
            aggregationFields = {},
            getDataFrom = 'day';


        if (start && end) {
            filter["$and"].push(
                    { 'metadata.date': { $gte: start} }, 
                    { 'metadata.date': { $lt: end}}
                );

            if(end - start <= limit * 60 * 100 ){
                // on item per miunte
                getDataFrom = 'minute';
            }else if(end - start <= limit * 60 * 60 * 100 ){
                // on item per houre
                getDataFrom = 'hour';
            }
        }

        // console.log(filter);
        db.collection('data', function(err, collection) {
            var itemsArray = [];
            var cursor = collection.find(filter, aggregationFields).sort( { 'metadata.date': 1 } );

            console.log(JSON.stringify(filter));
            // console.log("search data");

            cursor.each(function(err, item) {
                // If the item is null then the cursor is exhausted/empty and closed
                if(item == null) {
                    res.send(itemsArray);
                }else{
                    switch(getDataFrom){
                        case 'hour': 
                            Object.keys(item['hourly']).forEach(function(hour){
                                var date = new Date(item['metadata']['date']).addHours(hour);
                                var value = item['hourly'][hour];
                                _pushValueToArray(data, value, itemsArray);
                            });
                            break;
                        case 'minute': 
                            // console.log(item['minute']);
                            Object.keys(item['minute']).forEach(function(hour){
                                // console.log(item['minute'][hour]);
                                Object.keys(item['minute'][hour]).forEach(function(minute) {
                                    var date = new Date(item['metadata']['date']).addHours(hour).addMinutes(minute);
                                    var value = item['minute'][hour][minute];
                                    // console.log(value);
                                    _pushValueToArray(date, value, itemsArray);
                                })
                            });
                            break;
                        case 'day':
                        default:
                            // Default is Day
                            _pushValueToArray(item['metadata']['date'], item['day'], itemsArray);

                    }
                }
            });
        });
    };

    _pushValueToArray = function (date, value, itemsArray){
        if(value){
            itemsArray.push( [date.toJSON(), value]);
        }
    }

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
        _addData(req.app.get('db'), 
                        req.params.id, 
                        req.body["value"], 
                        new Date(), function(err, result){
            if (err) {
                // TODO send 500 Header;
                res.send(err);
            } else {
                res.send(result );
            }
            
        });
    }

    exports.addDemoData = function(req, res) {
        var endDate = new Date(); // NOW
        var actualDate = new Date();        // Now - 1year
        actualDate.setYear(endDate.getFullYear() - 1 );

        async.whilst(
            function () { return actualDate <= endDate; },
            function (callback) {
                _addData(req.app.get('db'), 
                    req.params.id, 
                    Math.floor(Math.random() * 16) + 1  , 
                    actualDate,function(){
                        actualDate.setUTCHours(actualDate.getUTCHours() + 1); // + 1 hour
                        callback(); 
                    });
            },
            function (err) {
                res.send(true);
            }
        );      
    }

    /*
    merge two object literals, if properties exist in both objects, the data takes precedence.
    */
    function _mergeConfig(template, data) {
        var obj = {};

        for (var x in template)
        if (template.hasOwnProperty(x))
        obj[x] = template[x];

        for (var x in data)
        if (data.hasOwnProperty(x))
        obj[x] = data[x];

        return obj;
    }

    _createDocumentId = function(year, month, day, channel){
        return String(year) + ("0" + (month + 1)).slice(-2) +   ("0" + (day + 1)).slice(-2) + "/" + channel;
    }

    // see http://docs.mongodb.org/ecosystem/use-cases/pre-aggregated-reports/
    _preAllocateDataDocument = function(db, channel, date, callback){

        var day = date.getUTCDate(),
            month = date.getUTCMonth(),
            year = date.getUTCFullYear();
        var idDay = _createDocumentId(year, month, day, channel);

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
            'day': 0.0,
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
        _createDocument(db, query, data, function(err,result){
            if (err) {
                typeof callback === 'function' && callback(err,null);
            }else{
                typeof callback === 'function' && callback(null,result);
            }
        });
    }

    /*
        Update document, if document does not exist create a new document
    */
    _updateDocument = function(db, query, data, date, channel, callback){

        _writeDocument(db, query, data, function(err,result){
            if (err) {
                // console.log("error updating document");
                // could not update, so try to create the document
                _preAllocateDataDocument(db, channel, date, function(err,result){
                    if (err) {
                        console.log('Error creating document: ' + err);
                        typeof callback === 'function' && callback(err,null);
                    }else{
                        // Now, the document exist, so we can update the docuemnt
                        // TODO: Optimize this, and try to write the data in the _preAllocateDataDocument function
                        _writeDocument(db, query, data, function(err,result){
                            if(err){
                                console.log('Error giving up to creating document: ' + err);
                                typeof callback === 'function' && callback(err,null);
                            }else{
                                // console.log("created Document");
                                typeof callback === 'function' && callback(null,result);
                            }
                        });

                    }
                }, data);
            } else {
                // console.log("updated document");
                typeof callback === 'function' && callback(null,result);
            }
        },{safe:true})       
    }

    /*
        create a new document with default values
    */
    _createDocument = function(db, query, data, callback){       
        _writeDocument(db, query, data, function(err,result){
            if (err) {
                console.log('Error creating document: ' + err);
                typeof callback === 'function' && callback(err,null);
            } else {
                typeof callback === 'function' && callback(null,result);
            }
        },{upsert:true, safe:true})
    }

    _writeDocument = function(db, query, data, callback, mode){
        mode = (typeof mode === "undefined") ? {upsert:true, safe:true} : mode;
        // Update daily statisics 
        db.collection('data', function(err, collection) {
            collection.update(query, data, mode, function(err, result) {
                if (err || !result) {
                    // console.log('Error writing document channel: ' + err);
                    err = err ? err : 'document not found';
                    typeof callback === 'function' && callback(err,null);
                } else {
                    typeof callback === 'function' && callback(null,result);
                }
            });
        });
    }

    _addData = function(db, channel, value, date, callback){
        var minute = date.getUTCMinutes(),
            hour = date.getUTCHours();
            day = date.getUTCDate(),
            month = date.getUTCMonth(),
            year = date.getUTCFullYear();
        var idDay = _createDocumentId(year, month, day, channel);

        var query = {
            '_id': idDay
        };
        var update = {};
        update['$inc'] = {};
        update['$inc']['day'] = value;
        update['$inc']['hourly.'+String(hour)] = value;
        update['$inc']['minute.'+String(hour)+"."+String(minute)] = value;

        _updateDocument(db, query, update, date, channel, function(result, err){
            if (err) {
                typeof callback === 'function' && callback(err,null);
            } else {
                typeof callback === 'function' && callback(null,result);
            }
        })
    }
});

