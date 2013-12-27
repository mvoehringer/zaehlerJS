window.Data = Backbone.Model.extend({

    urlRoot: "/data",

    idAttribute: "_id",

    initialize: function () {
    },


    defaults: {
        _id: null,
        name: "",
        description: ""
    }
});

window.DataCollection = Backbone.Collection.extend({
    model: Data,
    url: "/data"
});