var AppRouter = Backbone.Router.extend({

    routes: {
        ""                  : "home",
        "channels"	        : "listChannels",
        "channels/add"      : "addChannel",
        "channels/:id"      : "channelDetails",
        "about"             : "about"
    },

    home: function (id) {
        if (!this.homeView) {
            this.homeView = new HomeView();
        }
        $('#content')
            .html(this.homeView.el);
    },

	listChannels: function(page) {
        var p = page ? parseInt(page, 10) : 1;
        var channelList = new ChannelCollection();
        channelList.fetch({success: function(){
            $("#content")
                .html(new ChannelListView({model: channelList, page: p}).el);
        }});
    },

    channelDetails: function (id) {
        var channel = new Channel({_id: id});
        channel.fetch({success: function(){
            $("#content")
                .html(new ChannelView({model: channel}).el);
        }});
    },

	addChannel: function() {
        var channel = new Channel();
        $('#content')
            .html(new ChannelView({model: channel}).el);
	},

    about: function () {
        if (!this.aboutView) {
            this.aboutView = new AboutView();
        }
        $('#content')
            .html(this.aboutView.el);
    }
});

i18n.init({fallbackLng: false, debug: true},function() {
  // translate nav
  $(".nav").i18n();

  // programatical access
  // var appName = t("app.name");
});


utils.loadTemplate(['HomeView', 'ChannelView', 'ChannelListItemView', 'AboutView', 'LiveChannelView'], function() {
    app = new AppRouter();
    Backbone.history.start();
});