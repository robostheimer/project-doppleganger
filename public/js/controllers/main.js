var Doppleganger = angular.module('Doppleganger', ['ngRoute']);
angular.module('Ganger', [])

.factory('SearchYelp', ['$http', '$rootScope',
	function($http, $rootScope) {
		return {
			searchYelp: function(searchterms, location) {

				if($rootScope.geolocation) {
				return $http.get('/api/yelp/search?term='+searchterms+'&location='+location+'&cll='+$rootScope.geolocation.together+'&limit=10').then(function(result) {
					
					return result.data;
				});
			} else {
					return $http.get('/api/yelp/search/?term='+searchterms+'&location='+location+'&limit=10').then(function(result) {
						
						return result.data;
				});
			}
		},

			searchYelpBusiness: function(id) {
				return $http.get('/api/yelp/business/?name='+id).then(function(result) {
					
					return result.data;
			});
		}
	}
}])

.factory('Geolocation', ['$http', '$q', 'CityFind',
function($http, $q, CityFind) {
	return {
		checkGeolocation: function() {
			var deferred = $q.defer();
			navigator.geolocation.getCurrentPosition(function(data){
					CityFind.findCity(data.coords.latitude, data.coords.longitude, .01).then(function(location){
						deferred.resolve({lat: data.coords.latitude, lon: data.coords.longitude, city:location.city, state: location.state});
				})	
			}, function(error){
				deferred.resolve(false);
			});
			
			return deferred.promise;
		},
	};
}])

.factory('CityFind', ['$http', 
	function($http) {
	return {
			findCity : function(lat, lng, ratio) {
				var url = "https://www.googleapis.com/fusiontables/v1/query?sql=SELECT+CityName%2C+Region%2C+CountryID+FROM+1B8NpmfiAc414JhWeVZcSqiz4coLc_OeIh7umUDGs+WHERE+Lat+<=" + (lat+ratio) + "+AND+Lat>=" + (lat - ratio) + "+AND+Long<=" + (lng+ratio) + "+AND+Long>=" + (lng -ratio) + "&key=AIzaSyBBcCEirvYGEa2QoGas7w2uaWQweDF2pi0";
				
				return $http.get(url).then(function(data) {
					if (data.data.rows != null) {
						return {
							city: data.data.rows[0][0], 
							state: data.data.rows[0][1]
						};					
					}
				});
			}
		};
	}])

.controller('getYelpResults', ['$scope','$rootScope','$http','SearchYelp', 'Geolocation', '$q',
	function($scope, $rootScope, $http, SearchYelp, Geolocation, GeolocationFind, $q) {	 
	$scope.places = true;
	$scope.keywords = false;
	$scope.placesButtonState ='off';
	$scope.keywordsButtonState ='on';
	$scope.addTypeahead = true;
	$scope.loading = true;
	$scope.noBusinesses = false;
	$scope.searching = false;
	$scope.noMap = false;
	$scope.indivMap = false;
	$scope.viewIcons = [
		{
			name: 'icon-map',
			state: 'on',
			class: 'show',
			status: 'disabled'
		},
		{
			name: 'icon-boxes',
			state: 'off',
			class: 'hide',
			status: 'disabled'
		}
	];
	$scope.filterIcons = [
		{
			name: 'icon-sort-alpha-asc',
			state: 'off'
		},
		{
			name: 'icon-sort-alpha-desc',
			state: 'off'
		}
	];

		Geolocation.checkGeolocation().then(function(data){
		if(data !== false)
		{
			$rootScope.geolocation ={lat:0, lon:0, together:'', orig_lat:0, orig_lon: 0};
			$rootScope.geolocation.together = data.lat +', '+data.lon;
			$rootScope.geolocation.lat = data.lat;
			$rootScope.geolocation.lon = data.lon;
			$rootScope.geolocation.orig_lat = data.lat;
			$rootScope.geolocation.orig_lon = data.lon;
			$rootScope.geolocation.city_state = data.city+', '+data.state;
			$scope.whereyouare = data.city+', '+data.state;
			$scope.geolocationUsed = true;
			$scope.addTypeahead=true;
			$scope.loading=false;
			$scope.searching = true
		}
		$scope.addTypeahead = false;
		$scope.loading=false;
	});

	$scope.runSearch = function(searchterms, location) {
		
		$scope.keyword_results = [];
		$rootScope.markers =[];
		$scope.noBusinesses=false;

		
		if((searchterms !== undefined && searchterms !== "") && (location !== undefined && location !== ""))
		{
			$scope.searching = true;
			$scope.loading = true;

			SearchYelp.searchYelp(searchterms, location).then(function(result) {
				

				if(result.businesses.length === 0)
	 			{
	 				$scope.noBusinesses=true;
	 				$scope.searching = false;
	 			} else {
	 				//$rootScope.geolocation .together = ""
	 				
	 				if($rootScope.geolocation.together === "" || $rootScope.geolocation.together === undefined || $rootScope.geolocation.city_state!==location) {
						$rootScope.geolocation.together = result.businesses[0].location.coordinate.latitude +', '+result.businesses[0].location.coordinate.longitude;
						$rootScope.geolocation.lat = result.businesses[0].location.coordinate.latitude;
						$rootScope.geolocation.lon = result.businesses[0].location.coordinate.longitude;
						$rootScope.geolocation.orig_lat = result.businesses[0].location.coordinate.latitude;
						$rootScope.geolocation.orig_lon = result.businesses[0].location.coordinate.longitude;
					}	

			 	$scope.keyword_results =result.businesses; 

			 	result.businesses.forEach(function(item) {
			 		item.showIndivMap = false;	
			 		item.timesShowed = 0;
 					$rootScope.markers.push(item);
 				});
			 	$scope.markers_holder = $rootScope.markers //creates a cache of the markers;
			 	$scope.searching = false;
			 	$scope.enableButtons($scope.viewIcons);
			 	$scope.loading = false;
				}
			});
		}
	}
	
	$scope.runBusinessSearch = function(searchterms, location, destination) {
		
		$scope.placesyoulike_results = [];
		$rootScope.markers =[];
		$scope.noBusinesses=false;
		
		if((searchterms !== undefined && searchterms !== "") && (location !== undefined && location !== "")  && (destination !== undefined && destination !== ""))
		{
			$scope.searching = true;
			$scope.loading = true;
			SearchYelp.searchYelp(searchterms, location).then(function(result) {

	 		if(result.businesses.length === 0)
	 			{
	 				$scope.noBusinesses=true;
	 				$scope.searching = false;
	 				$scope.loading = false;
	 			}
	 			else {
			 		var id =result.businesses[0].id
			 		SearchYelp.searchYelpBusiness(id).then(function(data) {		
				 			var categoriesStr = '',
				 			placesCategoriesStr = '';
				 			data.categories.forEach(function(item) {
				 				categoriesStr+= item[0]+' ';
				 			});

				 			SearchYelp.searchYelp(categoriesStr, destination).then(function(moredata) {
				 				
								if(result.businesses.length == 0)
					 			{
					 				$scope.noBusinesses=true;
					 				$scope.searching = false;
					 				$scope.loading = false;
					 			}	else {

					 				if($rootScope.geolocation.together === "" || $rootScope.geolocation.together === undefined || $rootScope.geolocation.city_state!==destination) {
										$rootScope.geolocation.together = moredata.businesses[0].location.coordinate.latitude +', '+moredata.businesses[0].location.coordinate.longitude;
										$rootScope.geolocation.lat = moredata.businesses[0].location.coordinate.latitude;
										$rootScope.geolocation.lon = moredata.businesses[0].location.coordinate.longitude;
										$rootScope.geolocation.orig_lat = moredata.businesses[0].location.coordinate.latitude;
										$rootScope.geolocation.orig_lon = moredata.businesses[0].location.coordinate.longitude;
									}
					 				
					 				//$scope.placesyoulike_results = moredata.businesses;
					 				$scope.enableButtons($scope.viewIcons);
					 				
					 				moredata.businesses.forEach(function(item) {
					 					var o = moredata.businesses.indexOf(item)
					 					data.categories.forEach(function(second_item){
					 						if(item.categories[0][0] === second_item[0]) {
					 							if(!placesCategoriesStr.match(second_item[0]))
					 							{
					 								placesCategoriesStr += item.categories[0][0]; 
					 							}
					 						}
					 					});
					 					item.rank = o;
				 						item.showIndivMap = false;
				 						item.timesShowed = 0;
				 						$rootScope.markers.push(item);
				 					});
				 					$scope.markers_holder = $rootScope.markers;//creates a cache of the markers
					 			}	
					 			//add another check to rank results - basically re run SearchYelp.searchYelp for city of place you like to with the top three results to see if place you like is actually a doppleganger
					 			
								$scope.reOrderBusinesses(moredata.businesses, location, destination, placesCategoriesStr, result.businesses[0].name);
						 		
				 			});		
				 		});
			 		} 
			 });	
		}
	};

	$scope.reOrderBusinesses = function(arr, destination, location, categoriesStr, orig_searchterms) {
		if(arr.length>0)
		{
			var contain_arr = [],
			o=0,
			j=0
			lngth = arr.length;
			arr.forEach(function(item) {

				SearchYelp.searchYelp(item.name, location).then(function(result) {
		 			SearchYelp.searchYelpBusiness(result.businesses[0].id).then(function(data) {
			 			var categoriesStr = ''
			 			data.categories.forEach(function(item) {
			 				categoriesStr+= item[0]+' ';
			 			})
			 			SearchYelp.searchYelp(categoriesStr, destination).then(function(moredata) {
			 				var i;

			 				for(i=0; i<moredata.businesses.length; i++) {
			 					j++

			 					if(moredata.businesses[i].name === orig_searchterms)
			 					{
				 					o--
				 					result.businesses[0].rank=o;
				 					result.businesses[0].showIndivMap = false;
				 					result.businesses[0].timesShowed = 0;
				 					arr.splice(0, 0, result.businesses[0]);
				 					
				 					
			 					}
			 					if(j==moredata.businesses.length*lngth)
				 					{
					 					arr = arr.removeDuplicatesArrObj('id', true)
					 					$scope.placesyoulike_results = arr;
				 						$scope.searching = false;
					 					$scope.loading = false;
			 						}
			 				}
			 			});		
			 		});
			 	})	
			})
			//remove Duplicates and keep lower ranked 
			//problem with sorting algorithm in prototypes.js
		}
	};

/**
	TODO: Filter by geolocation, rating, # of reviews
	Make the form inputs more friendly on a phone/think about design (cards with images?)
	custom markers ?
	Add # of miles and ability to get directions using ArcGIS
	Color Code the cards by ranking
**/	
	$scope.showMap = function() {
		$scope.noMap = false;		
		$rootScope.markers = $scope.markers_holder;
	}

	$scope.showIndivMap = function(index, type) {
		if(type == 'place') {
			$scope.placesyoulike_results[index].showIndivMap = true;
			if($scope.placesyoulike_results[index].timesShowed === 0)
			{
				$scope.createIndivMap($scope.placesyoulike_results[index], index, type);
				$scope.placesyoulike_results[index].timesShowed++;
			}
		}
		else {
			$scope.keyword_results[index].showIndivMap = true;
			if($scope.keyword_results[index].timesShowed === 0) {
				$scope.createIndivMap($scope.keyword_results[index], index, type);
				$scope.keyword_results[index].timesShowed++;
			}
		}
	}

	$scope.hideIndivMap = function(index, type) {
		if(type ==='place')
		{
		$scope.placesyoulike_results[index].showIndivMap = false;
		}
		else {
			$scope.keyword_results[index].showIndivMap = false;
		}
	}


	$scope.hideMap = function() {
		$scope.noMap = true;
		$rootScope.markers = $scope.markers_holder;
	}
	
	$scope.showKeywords = function() {
		$scope.places = true;
		$scope.keywords = false;
		$scope.placesButtonState='off';
		$scope.keywordsButtonState='on';
	};

	$scope.showPlaces = function() {
		$scope.places = false;
		$scope.keywords = true;
		$scope.placesButtonState='on';
		$scope.keywordsButtonState='off';
	};
	
	$scope.enableButtons = function(btnArr) {
		btnArr.forEach(function(item){
			item.status = 'enabled'
		});
	}
	
	$scope.changeView = function(type) {
		$scope.viewIcons.forEach(function(item, name){
			if(item.status !== 'disabled') {

				if(type==item.name)
				{
					item.state = 'on';	
					item.class = 'show';
				} else {
					item.state = 'off';
					item.class = 'hide'
				}
			}
		})
	};

$scope.createIndivMap = function(item, index, type) {
	var mapId = type+index,

	map = new L.Map(mapId,{}),
	
	INDIV_MAP = L.tileLayer('http://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png', {attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="http://cartodb.com/attributions">CartoDB</a>',
				subdomains: '1234',
				mapID: 'newest',
				app_id: 'Y8m9dK2brESDPGJPdrvs',
				app_code: 'dq2MYIvjAotR8tHvY8Q_Dg',
				base: 'base',
				minZoom: 0,
				maxZoom: 20					
				}),
	
	circle = L.circle([$rootScope.geolocation.orig_lat, $rootScope.geolocation.orig_lon], 125, {
				    color: '#428bca',
				    fillColor: '#428bca',
				    fillOpacity: 0.15
					})
	marker_content = '<a href="'+item.url+'" target="_blank">'+item.name+'</a><br>'+item.location.address[0]+'<br>'+item.location.city+'<br><a href="tel://'+item.display_phone+'">'+item.display_phone+'</a><br><img src="'+item.rating_img_url+'" alt="'+item.rating+' stars">', 
	
	marker = L.marker([item.location.coordinate.latitude, item.location.coordinate.longitude]).bindPopup(marker_content);
	
	map.animate=true;
	map._zoom = 13	;
	map.scrollWheelZoom.disable();
	map.panTo([item.location.coordinate.latitude, item.location.coordinate.longitude]);
 	map.zoomControl.options.position='topright';
	if($scope.geolocationUsed){
		circle.addTo(map);	
	}
	marker.addTo(map);
	map.addLayer(INDIV_MAP);
	$('#'+mapId).css({'width': '100%'});	
}

}])

.directive('dgMap',  function ($rootScope) {
	
 return {
	 restrict: 'AE',
     scope: { }, 
     transclude: true,

    link: function(scope, element, attr ) {
	    $rootScope.markers =[];
			$rootScope.geolocation={};
			$rootScope.geolocation.lat = 41.654811;
      $rootScope.geolocation.lon = -91.5380717;
			$rootScope.geolocation.orig_lat=0;
			$rootScope.geolocation.orig_lon=0;
			$rootScope.geolocation.zoom=13;
			$rootScope.mapOpening=true;
	        	

			var map = new L.Map("map",{});
			var markers=[];
			var cirlce;

			//var HERE_normalDayGrey = L.tileLayer('http://{s}.{base}.maps.cit.api.here.com/maptile/2.1/maptile/{mapID}/normal.day.grey/{z}/{x}/{y}/256/png8?app_id={app_id}&app_code={app_code}', {attribution: 'Map &copy; 1987-2014 <a href="http://developer.here.com">HERE</a>',
			//var HERE_carnavDayGrey = L.tileLayer('http://{s}.{base}.maps.cit.api.here.com/maptile/2.1/maptile/{mapID}/carnav.day.grey/{z}/{x}/{y}/256/png8?app_id={app_id}&app_code={app_code}', {attribution: 'Map &copy; 1987-2014 <a href="http://developer.here.com">HERE</a>',

			//var Esri_WorldGrayCanvas = L.tileLayer('http://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}', {attribution: 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ',
			//var OpenStreetMap_Mapnik = L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
			//var Esri_WorldStreetMap = L.tileLayer('http://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}', {attribution: 'Tiles &copy; Esri &mdash; Source: Esri, DeLorme, NAVTEQ, USGS, Intermap, iPC, NRCAN, Esri Japan, METI, Esri China (Hong Kong), Esri (Thailand), TomTom, 2012',
	//});			
			//var Esri_WorldTopoMap = L.tileLayer('http://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}', { attribution: 'Tiles &copy; Esri&mdash; Source: Esri, DeLorme, NAVTEQ, USGS, Intermap, iPC, NRCAN, Esri Japan, METI, Esri China (Hong Kong), Esri (Thailand), TomTom, 2012',

			var MAP = L.tileLayer('http://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png', {attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="http://cartodb.com/attributions">CartoDB</a>',
				subdomains: '1234',
				mapID: 'newest',
				app_id: 'Y8m9dK2brESDPGJPdrvs',
				app_code: 'dq2MYIvjAotR8tHvY8Q_Dg',
				base: 'base',
				minZoom: 0,
				maxZoom: 20					
				});
			var marker_content = '';

			map.addLayer(MAP); 	
    	   	  	
    	attr.$observe('change', function() {

    		markers.forEach(function(item){
    			map.removeLayer(item);
    		});
				if($rootScope.geolocation.orig_lat === undefined || $rootScope.geolocation.orig_lon === undefined || $rootScope.geolocation.orig_lat===0 || $rootScope.geolocation.orig_lon === 0)
					{
						$rootScope.geolocation.orig_lat = $rootScope.geolocation.lat 
						$rootScope.geolocation.orig_lon = $rootScope.geolocation.lon
					}	
				var circle = L.circle([$rootScope.geolocation.orig_lat, $rootScope.geolocation.orig_lon], 125, {
				    color: '#428bca',
				    fillColor: '#428bca',
				    fillOpacity: 0.15
					}).addTo(map);

      	if($rootScope.markers.length>0)
      	{
      		markers =[];
      		var i =0
      		$rootScope.markers.forEach(function(marker) {
      		i++
					marker_content='<a href="'+marker.url+'" target="_blank">'+marker.name+'</a><br>'+marker.location.address[0]+'<br>'+marker.location.city+'<br><a href="tel://'+marker.display_phone+'">'+marker.display_phone+'</a><br><img src="'+marker.rating_img_url+'" alt="'+marker.rating+' stars">';
					markers.push(L.marker([marker.location.coordinate.latitude, marker.location.coordinate.longitude]).bindPopup(marker_content));
					});
       	}

	      map.animate=true;
				map._zoom = 13	;
				map.scrollWheelZoom.disable();
				map.panTo([attr.latitude, attr.longitude]);
			 	map.zoomControl.options.position='topright';
				markers.forEach(function(marker) {
					marker.addTo(map);
				});
      }); 
    }  
   };
	});		     
