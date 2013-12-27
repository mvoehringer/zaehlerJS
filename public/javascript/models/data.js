window.Data = Backbone.Model.extend({

    urlRoot: "/data",

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
    url: "/data/52b8caa4eb30c37c2e9800c6"
});