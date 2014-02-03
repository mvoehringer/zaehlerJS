window.Channel = Backbone.Model.extend({

    urlRoot: "/api/channels",

    idAttribute: "_id",

    initialize: function () {
        this.validators = {};

        this.validators.name = function (value) {
            return value.length > 0 ? {isValid: true} : {isValid: false, message: "You must enter a name"};
        };
        this.validators.kind = function (value) {
            return value.length > 0 ? {isValid: true} : {isValid: false, message: "You must select the type of sensor"};
        };
        this.validators.unit = function (value) {
            return value.length > 0 ? {isValid: true} : {isValid: false, message: "You must select the unit"};
        };
    },

    validateItem: function (key) {
        return (this.validators[key]) ? this.validators[key](this.get(key)) : {isValid: true};
    },

    // TODO: Implement Backbone's standard validate() method instead.
    validateAll: function () {

        var messages = {};

        for (var key in this.validators) {
            if(this.validators.hasOwnProperty(key)) {
                var check = this.validators[key](this.get(key));
                if (check.isValid === false) {
                    messages[key] = check.message;
                }
            }
        }

        return _.size(messages) > 0 ? {isValid: false, messages: messages} : {isValid: true};
    },

    defaults: {
        _id: null,
        name: "",
        description: "",
        kind: "",
        resolution: "",
        unit: "",
        value: "-",
        active: true
    }
});

window.ChannelCollection = Backbone.Collection.extend({

    model: Channel,

    url: "/api/channels"

});