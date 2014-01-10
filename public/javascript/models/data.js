window.Data = Backbone.Model.extend({

    urlRoot: "/api/data",

    idAttribute: "_id",

    initialize: function () {
    },


    defaults: {
        _id: null,
        date: "",
        value: ""
    }
});

window.DataCollection = Backbone.Collection.extend({
    model: Data,
    url: "/api/data/"
});