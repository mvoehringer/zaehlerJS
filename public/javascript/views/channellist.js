window.ChannelListView = Backbone.View.extend({

    initialize: function () {
        this.render();
    },
    addOne: function(channel) {
        var channelView = new ChannelListItemView({model: channel});
        $('.list-group', this.el).append(channelView.render().el);
    },
    render: function () {
        var channels = this.model.models;
        $(this.el).html('<ul class="list-group"> </ul>');

        channels.forEach(this.addOne, this);
        return this;
    }

});

window.ChannelListItemView = Backbone.View.extend({

    // tagName: "li",

    initialize: function () {
        this.model.bind("change", this.render, this);
        this.model.bind("destroy", this.close, this);
    },

    render: function () {
        $(this.el).html(this.template(this.model.toJSON()));
        return this;
    }

});