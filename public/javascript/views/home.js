

Date.prototype.subtractHour= function(hour){
    this.setHours(this.getHours()-hour);
    return this;
};

Date.prototype.subtractDay= function(days){
    this.subtractHour(days * 24);
    return this;
};

Date.prototype.subtractWeek= function(week){
    this.subtractDay(week * 7);
    return this;
};


window.HomeView = Backbone.View.extend({
    chart : "",
    
    initialize:function () {
    	var that = this;
		channelsList = new ChannelCollection(Channel);	
		channelsList.fetch({
			success: function (channels, response) {
				that.channels = channels;
				that.chartOptions = that.getChartOptions();
				that.render();
			},
			error: function() {
				console.log('Failed to fetch!');
			}
		});
	},
	
	events: {
        "click .scale-chart"   : "scaleChart",
        "click .delete" : "deleteChannel"
    },

	render: function(){
		var that = this;
		$(this.el)
			.html(this.template())
			.i18n(); // translate 
    	
    	// wait, till view is load
    	_(function() {
    		that.renderChart();
    		that.renderLiveChannels();
   		}).defer();
    },
 
    scaleChart: function(event){
    	var target = event.target;
    	var now = new Date();
    	var nowTimestamp = new Date().getTime();
    	var startTimestamp = new Date().getTime();

    	switch($(target).attr('id')){
    		case "chart-now":
				startTimestamp = now.subtractHour(1).getTime();
			 	break;
			case "chart-day":
				startTimestamp = now.subtractDay(1).getTime();
				break;
			case "chart-week":
				startTimestamp = now.subtractWeek(1).getTime();
				break;
			case "chart-month":
				startTimestamp = now.subtractWeek(4).getTime();
				break;
			case "chart-year":
				startTimestamp = now.subtractWeek(52).getTime();
				break;
			default:
				// find oldest item 
				_.each(this.chart.series, function(serie){
					var min = _.min(serie.data, function(item){
							return item['x'];
					});
					if(min['x'] < startTimestamp){
						startTimestamp = min['x'];
					}
				});
				break;
    	}
    	this.chart.xAxis[0].setExtremes(startTimestamp, nowTimestamp + 30000);
    },

    renderChart:function () {
    	var that = this;

        this.chart = new Highcharts.Chart(this.chartOptions);
		Highcharts.setOptions({  
			// This is for all plots, change Date axis to local timezone
			global : {
				useUTC : false
			}
		});
		
		// loading data
		_.each(this.channels.models, function(model) {

			if(model.get('active') === false){
				return;
			}
			// console.log(model.get('name'));
			var dataList = new DataCollection(Data);
			dataList.url =  "/api/data/" +  model.get('_id');

			dataList.fetch({
				success: function (data, response) {

					// add series to highchart
					function _setSeries(response, data, dataList){
						var dataArray = [];
						response.forEach(function(date){
							dataArray.push([ new Date(date[0]).getTime(), date[1]]);
						});

						that.chart.addSeries({
							name: model.get('name'),
							data: dataArray,
							channelId:  model.get('_id'),
							channelUrl: dataList.url,
						
							marker : { 
								enabled : false,
								radius: '2px'
							}
						});
					}

					if(response.length > 1){
						_setSeries(response, data, dataList);
					}else{
						if(response.length == 1){
							// only one item returnd, try to fetch a more detail version
							var dateToFetch = new Date(response[0][0]);

							var detailDataList = new DataCollection(Data);
							detailDataList.url =  "/api/data/" +  model.get('_id');
							var search_params = {
							  'start': dateToFetch.getTime(),
							  'end':  dateToFetch.setHours(24)
							};
							detailDataList.fetch({
								data: $.param(search_params),
								success: function (data, response) {
									_setSeries(response, data, detailDataList);
								}
							});
						}
					}
				},
				error: function(e) {
					console.error('Failed to fetch data!' + e);
				}
			});
		});

        return this;
    },

    getChartOptions: function () {
    	// Configure chart
    	return {
			chart: {
				renderTo: 'chart',
				type: 'line',
				// animation: false,
				zoomType: 'x'
			},
			credits:{
				enabled: false
			},
			plotOptions: {
				line: {
					lineWidth: '1px',
					animation: true,
					marker: {
						enabled: false
					}
				}
			},
			title: {
				text: ''
			},
			tooltip:{
				enabled: false
			},
			xAxis: {        
				type: 'datetime',
				minRange: 100 * 1000, // one hour
				labels: {
					dateTimeLabelFormats: {
						minute: '%H:%M',
						hour: '%H:%M',
						day: '%e. %b',
						week: '%e. %b',
						month: '%b \'%y',
						year: '%Y'
					}
				},
				events: {
					afterSetExtremes: function(e) {
						var url,
							currentExtremes = this.getExtremes();
						var chart = $('#chart').highcharts();
						var min = 0;
					    var max =  new Date();
				
					    if(!isReset){
					        min = e.min;
					        max = e.max;
					    }

						// console.log("afterSetExtremes");
						chart.showLoading('Loading ...');

						chart.series.forEach(function(serie){
							$.getJSON(serie.options.channelUrl, {
								start: Math.round(min),
								end:   Math.round(max)
							}).done(function( data ) {
								var dataArray = [];
								data.forEach(function(date){
									dataArray.push([ Date.parse(date[0]), date[1]]);
								});
								if(dataArray.length > 2){
									chart.series[ serie._i ].setData(dataArray);
								}
								chart.hideLoading();
							});
						});

					},
					setExtremes: function (e) {
                        if (e.max === null || e.min === null) {
                           isReset = true;                            
                        }
                        else
                        {
                         isReset = false;   
                        }
                    }
				}
			}
		};
    },

    renderLiveChannels: function(){
    	var that = this;
    	_.each(this.channels.models, function(channel) {
    		if(channel.get('active') !== true){
    			return;
	   		}
			var liveChannelView = new LiveChannelView({
				model: channel
			});

			$("#liveChannels").append(liveChannelView.render().el);

			var socket = io.connect();
			// Listen to new data on websocket
			socket.on('data-' + channel.get('_id'), function(data) {

				// set new data to channel object
				that.channels.get(channel.get('_id')).set({value: data.value });

				_.each(that.chart.series, function(serie){
					if(serie.options.channelId == channel.get('_id')){
						serie.addPoint([Date.parse(data.date), data.value], true, false);
					}
				});	
			}); 
        });
    }
});



window.LiveChannelView = Backbone.View.extend({
	tagName: "span",
	className: "" ,
	
	initialize: function() {
  		this.model.on('change',this.render,this);
	},

    render: function () {
    	$(this.el).html(this.template({
    			model: this.model.toJSON(),
    			view: this
    		}));
        return this;
    },
    formatData: function(data){
    	if(_.isNumber(data.value)){
	    	return this.twoDecimals(data.value) + " " + this.unitForValue(data.unit);
    	}else{
    		return "-";
    	}
    },
	
	unitForValue: function(unit){
		switch(unit){
			case "temperature":
				return "℃";
				break;
			case "power":
				return "W";
				break;
			case "energy":
				return "Wh";
				break;
			case "volume":
				return "m³";
				break;
			default:
				return "";
				break;
		}
		return "";
	},

	twoDecimals: function(data){
    	return Number(data).toFixed(2).toLocaleString();
    }

});