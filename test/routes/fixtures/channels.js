var id = require('pow-mongodb-fixtures').createObjectId;

var channels = exports.channels = {
    channel1: {
        _id: id(),
        name: 'Electricity',
        description: "Electricity at home"
    }
}