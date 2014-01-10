



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
					Highcharts.setOptions({  
						// This is for all plots, change Date axis to local timezone
						global : {
							useUTC : false
						}
					});
    			}).defer();
				
				// loading data
				_.each(channels.models, function(model) {

					var socket = io.connect();
					// Listen to new data on websocket
					console.log('data-'+ model.get('_id'));
					socket.on('data-' + model.get('_id'), function(data) {
						console.log("recived data" + data);
						$("#dataView").append('<div class="message">'+ data.date + ' - ' + data.channel + ' : ' + data.value + '</div>');
					});

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
											_setSeries(response, data, detailDataList)
										}
									})
								}
							}
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
		$('#chart-now').on("click", function(){
			// console.log( $( this ).text() );
			console.log('click');
		});
		$('#chart-now').click(function(){
			console.log("on click");
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