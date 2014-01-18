var id = require('pow-mongodb-fixtures').createObjectId;

var channels = exports.channels = {
    channel1: {
        _id: '7a3db63e-9ae0-4090-b736-d0dbbb389e10',
        name: 'Channel 1',
        kind: 'impulse',
        resolution: '10000',
        unit: 'energy',
        description: 'description channel 1'
    },
    channel2: {
        _id: '8a3db63e-9ae0-4090-b736-d0dbbb389e11',
        name: 'Channel 2',
        kind: 'absolut',
        resolution: '',
        unit: 'temperature',      
        description: 'description channel 2'
    }
}
