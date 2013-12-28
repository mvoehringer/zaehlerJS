var id = require('pow-mongodb-fixtures').createObjectId;

var channels = exports.channels = {
    channel1: {
        _id: id('52b8caa4eb30c37c2e9800c6'),
        name: 'Channel 1',
        description: "description channel 1"
    },
    channel2: {
        _id: id('52bf1baf9b6591a93163ac77'),
        name: 'Channel 2',
        description: "description channel 2"
    }
}