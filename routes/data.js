if (typeof define !== 'function') {
    var define = require('amdefine')(module);
}
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
        _pushValueToArray = function (date, item, itemsArray, minDate, maxDate){
            // ignore values out of timeslice
            if(date < maxDate || date >= minDate ){
                // ignore empty values
                if(item && item.value){
                    // TODO scale value based on item.count
                    itemsArray.push( [date.toJSON(), item.value]);
                }
            }
        }

        var channelId = req.params.id,
            // TODO: Set default fo date
            start     = _createDate(req.query['start']),
            end       = _createDate(req.query['end']),
            limit     = req.query['limit'] ? parseInt(req.query['limit']) : 500,
            filter    = {  
                        $and: [
                            {'metadata.channel': channelId }
                        ]},
            db        = req.app.get('db'),
            aggregationFields = {minute:false, hourly:false},
            getDataFrom = 'day';

        if (start && end) {
            
            var filterStart = new Date(start.getTime()),
                filterEnd = new Date(end.getTime());
            // fetch minimum of one day if start 
            if( start - end <= 24 * 60 * 60 * 1000  ){
                filterStart.setHours(0,0,0,0);
                fiterEnd = new Date(filterStart.getTime());
                fiterEnd.addHours(24);
            }
            filter["$and"].push(
                    { 'metadata.date': { $gte: filterStart} }, 
                    { 'metadata.date': { $lt: filterEnd}}
                );

            if(end - start <= limit * 60 * 1000 ){
                // on item per miunte
                getDataFrom = 'minute';
                aggregationFields = {day:false, hourly:false};
            }else if(end - start <= limit * 60 * 60 * 1000 ){
                // on item per houre
                getDataFrom = 'hour';
                aggregationFields = {minute:false, day:false};
            }
        }
        
        db.collection('data', function(err, collection) {
            var itemsArray = [];
            // console.log(JSON.stringify(filter));
            var cursor = collection.find(filter, aggregationFields).sort( { 'metadata.date': 1 } );

            cursor.each(function(err, item) {
                // If the item is null then the cursor is exhausted/empty and closed
                if(item == null) {
                    res.send(itemsArray);
                }else{
                    switch(getDataFrom){
                        case 'hour':
                            Object.keys(item['hourly']).forEach(function(hour){
                                var date = new Date(item['metadata']['date']);
                                date.setUTCHours(hour);
                                var value = item['hourly'][hour];
                                _pushValueToArray(date, value, itemsArray, start, end);
                            });
                            break;
                        case 'minute': 
      
                            Object.keys(item['minute']).forEach(function(hour){
                                // console.log(item['minute'][hour]);
                                Object.keys(item['minute'][hour]).forEach(function(minute) {
                                    var date = new Date(item['metadata']['date']);
                                    date.setUTCHours(hour);
                                    date.setUTCMinutes(minute);

                                    var value = item['minute'][hour][minute];
                                    // console.log(value);
                                    _pushValueToArray(date, value, itemsArray, start, end);
                                })
                            });
                            break;
                        case 'day':
                        default:
                            // Default is Day
                            _pushValueToArray(item['metadata']['date'], item['day'], itemsArray, start, end);
                    }
                }
            });
        });
    };

    _createDate = function(string){

        var date = new Date(string);
        if ( Object.prototype.toString.call(date) === "[object Date]" ) {
            if ( isNaN( date.getTime() ) ) {  // d.valueOf() could also work
                // date is not valid
                date = new Date(Math.round(string));
                if ( Object.prototype.toString.call(date) === "[object Date]" ) {
                    if ( !isNaN( date.getTime() ) ) {  // d.valueOf() could also work
                        return date;
                    }
                }
            }else {
                // date is valid
                return date;
            }
        }
        return null;
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
        var value  = (typeof req.body["value"] === "undefined") ? 1 : req.body["value"];
        var date  = (typeof req.params.date === "undefined") ? new Date() : _createDate(req.params.date);
        var db = req.app.get('db');
        var channel = req.params.id;

        _saveTuple = function(item, callback){
            var db = req.app.get('db');
            var value = item[1];
            var date = _createDate(Math.round(item[0]));

            _addData(db, 
                    channel, 
                    value, 
                    date, function(err, result){
                        callback(err);
            });
        }

        // fallback for the voelkszaehler.org middleware
        if(typeof req.params.ts !== "undefined"){
            date = _createDate(req.params.ts);
        }

        if( Object.prototype.toString.call( req.body[0] ) === '[object Array]' ) {
            // voelkszaehler.org tuples 
            async.each(req.body, _saveTuple, function(err){
                if (err) {
                    console.error(err);
                    res.send(500, err);
                } else {
                    res.send(200, "true");
                } 
            
            });
        }else{
            // Use offical zaehlerjs API
            _addData(db, 
                    channel, 
                    value, 
                    date, function(err, result){
                if (err) {
                    console.error(err);
                    res.send(500, err);
                } else {
                    res.send(200, "true");
                }            
            });
        }
    }

    exports.addDemoData = function(req, res) {
        var endDate = new Date(); // NOW
        var actualDate = new Date();        // Now - 1year
        actualDate.setYear(endDate.getFullYear() - 3 );

        async.whilst(
            function () { return actualDate <= endDate; },
            function (callback) {
                _addData(req.app.get('db'), 
                    req.params.id, 
                    Math.floor(Math.random() * 16) + 1  , 
                    actualDate,function(){
                        actualDate.setMinutes(actualDate.getMinutes() + 1); // + 1 minute
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
        return String(year) + ("0" + (month)).slice(-2) +   ("0" + (day)).slice(-2) + "/" + channel;
    }

    // see http://docs.mongodb.org/ecosystem/use-cases/pre-aggregated-reports/
    _preAllocateDataDocument = function(db, channel, date, callback){

        var day = date.getUTCDate(),
            month = date.getUTCMonth()+1,
            year = date.getUTCFullYear();
        var idDay = _createDocumentId(year, month, day, channel);

        var dayObject = date;
        dayObject.setUTCHours(0);
        dayObject.setUTCMinutes(0);
        dayObject.setUTCSeconds(0);
        dayObject.setUTCMilliseconds(0);

        var query = {
            '_id': idDay,
            'metadata': { 
                'date': dayObject, 
                'channel': channel
            }
        }

        var data = {
            '_id': idDay,
            'metadata': { 
                'date': dayObject, 
                'channel': channel
            },
            'day': {
                value: 0,
                count: 0
            },
            'hourly': {},
            'minute': {}
        }
        for(hour=0; hour <24;hour ++){
            data['hourly'][hour] = {};
            data['hourly'][hour]['value'] = 0;
            data['hourly'][hour]['count'] = 0;
            data['minute'][hour] = {};
            for(minute=0;minute < 60;  minute++){
                data['minute'][hour][minute] = {};
                data['minute'][hour][minute]['value'] = 0;
                data['minute'][hour][minute]['count'] = 0;
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
            month = date.getUTCMonth() + 1,
            year = date.getUTCFullYear();
        var idDay = _createDocumentId(year, month, day, channel);
        var query = {
            '_id': idDay
        };

        value = parseFloat(value);

        var update = {};
        update['$inc'] = {};
        update['$inc']['day.value'] = value;
        update['$inc']['day.count'] = 1;
        update['$inc']['hourly.'+String(hour)+".value"] = value;
        update['$inc']['hourly.'+String(hour)+".count"] = 1;
        update['$inc']['minute.'+String(hour)+"."+String(minute)+".value"] = value;
        update['$inc']['minute.'+String(hour)+"."+String(minute)+".count"] = 1;

        _updateDocument(db, query, update, date, channel, function(err, result){
            if (err) {
                typeof callback === 'function' && callback(err,null);
            } else {
                typeof callback === 'function' && callback(null,result);
            }
        })
    }
});

