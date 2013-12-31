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
								channelId:  model.get('_id'),
								channelUrl: dataList.url,
							
								marker : { 
									enabled : false,
									radius: '2px'
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

    getChartOptions: function () {
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
			plotOptions: {
				line: {
					lineWidth: '1px',
					animation: false,
					marker: {
						enabled: false
					}
				}
			},
			title: {
				text: 'Aktueller Zähler'
			},
			tooltip:{
				enabled: false
			},
			xAxis: {        
				type: 'datetime',
				minRange: 3600 * 1000, // one hour
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
						chart.showLoading('Loading data from server...');

						chart.series.forEach(function(serie){
							$.getJSON(serie.options.channelUrl, {
								start: Math.round(min),
								end:   Math.round(max)
							}).done(function( data ) {
								var dataArray = [];
								data.forEach(function(date){
									dataArray.push([ Date.parse(date[0]), date[1]]);
								})
								if(dataArray.length > 2){
									chart.series[ serie._i ].setData(dataArray);
								}
								chart.hideLoading();
							});
						});

					},
					setExtremes: function (e) {
                        if (e.max == null || e.min == null) {
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
});