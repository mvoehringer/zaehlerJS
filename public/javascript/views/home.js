window.HomeView = Backbone.View.extend({

    initialize:function () {
		this.channels = new ChannelCollection(Channel);
		this.chartOptions = this.getChartOptions();
		this.render();
	},

    render:function () {
    	var that = this;
    	var chart;
    	this.channels.fetch({
	        success: function (channels, response) {
				$(that.el)
					.html(that.template());

				// defered loading of the chart
				_(function() {
			        that.chart = new Highcharts.Chart(that.chartOptions);
    			}).defer();
				
				// loading data
				_.each(channels.models, function(model) {
					// console.log(model.get('name'));
					var dataList = new DataCollection(Data);
					dataList.url =  "/data/" +  model.get('_id');
					dataList.fetch({
						success: function (data, response) {

							var dataArray = [];
							response.forEach(function(date){
								dataArray.push([ Date.parse(date[0]), date[1]]);
							})

							that.chart.addSeries({
								name: model.get('name'),
								data: dataArray,
								marker : { 
									enabled : false
								}
							});

						},
						error: function() {
							console.log('Failed to fetch data!');
						}
					});
				});
			},
	        error: function() {
	             console.log('Failed to fetch!');
	        }
   		});
        return this;
    },

    getChartOptions:function () {
    	// Configure chart
    	return {
			chart: {
				renderTo: 'chart',
				type: 'line',
				animation: false,
				zoomType: 'x'
			},
			credits:{
				enabled: false
			},
			title: {
				text: 'Aktueller Zähler'
			},
			xAxis: {        
				type: 'datetime',
				labels: {
					dateTimeLabelFormats: {
						minute: '%H:%M',
						hour: '%H:%M',
						day: '%e. %b',
						week: '%e. %b',
						month: '%b \'%y',
						year: '%Y'
					}
				}
			}
		};
    },

});