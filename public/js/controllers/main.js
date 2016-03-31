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
		}
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
	$scope.noMap = true;
	$scope.indivMap=false

		Geolocation.checkGeolocation().then(function(data){
		if(data !== false)
		{
			$rootScope.geolocation ={lat:0, lon:0, together:'', orig_lat:0, orig_lon: 0};
			$rootScope.geolocation.together = data.lat +', '+data.lon;
			$rootScope.geolocation.lat = data.lat;
			$rootScope.geolocation.lon = data.lon;
			$rootScope.geolocation.orig_lat = data.lat;
			$rootScope.geolocation.orig_lon = data.lon;
			$scope.whereyouare = data.city+', '+data.state;
			$scope.addTypeahead=true;
			$scope.loading=false
		}

		$scope.addTypeahead = false;
		$scope.loading=false
	});

	$scope.runSearch = function(searchterms, location) {
		
		$scope.keyword_results = [];
		$rootScope.markers =[];
		$scope.noBusinesses=false;

		
		if((searchterms !== undefined && searchterms !== "") && (location !== undefined && location !== ""))
		{
			$scope.searching = true;

			SearchYelp.searchYelp(searchterms, location).then(function(result) {
				

				if(result.businesses.length === 0)
	 			{
	 				$scope.noBusinesses=true;
	 				$scope.searching = false;
	 			} else {
	 				$rootScope.geolocation .together = ""
	 				
	 				if($rootScope.geolocation.together === "" || $rootScope.geolocation.together === undefined) {
						$rootScope.geolocation.together = result.businesses[0].location.coordinate.latitude +', '+result.businesses[0].location.coordinate.longitude;
						$rootScope.geolocation.lat = result.businesses[0].location.coordinate.latitude;
						$rootScope.geolocation.lon = result.businesses[0].location.coordinate.longitude;
					}	

			 	$scope.keyword_results =result.businesses; 

			 	result.businesses.forEach(function(item) {
			 		item.showIndivMap = false;
 					$rootScope.markers.push(item);
 				});
			 	$scope.markers_holder = $rootScope.markers //creates a cache of the markers;
			 	$scope.searching = false;
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
			SearchYelp.searchYelp(searchterms, location).then(function(result) {

	 		if(result.businesses.length === 0)
	 			{
	 				$scope.noBusinesses=true;
	 				$scope.searching = false;
	 			}
	 			else {
			 		var id =result.businesses[0].id
			 		SearchYelp.searchYelpBusiness(id).then(function(data) {
				 			
				 			var categoriesStr = ''
				 			data.categories.forEach(function(item) {
				 				categoriesStr+= item[0]+' '
				 			})
				 			SearchYelp.searchYelp(categoriesStr, destination).then(function(moredata) {
				 				
								if(result.businesses.length == 0)
					 			{
					 				$scope.noBusinesses=true;
					 				$scope.searching = false;
					 			}	else {
					 				$rootScope.geolocation .together = ""
					 				
					 				if($rootScope.geolocation.together === "" || $rootScope.geolocation.together === undefined) {
										$rootScope.geolocation.together = moredata.businesses[0].location.coordinate.latitude +', '+moredata.businesses[0].location.coordinate.longitude;
										$rootScope.geolocation.lat = moredata.businesses[0].location.coordinate.latitude;
										$rootScope.geolocation.lon = moredata.businesses[0].location.coordinate.longitude;
									}
					 				
					 				$scope.placesyoulike_results = moredata.businesses;
					 				$scope.searching = false;
					 				
					 				moredata.businesses.forEach(function(item) {
				 						item.showIndivMap = false;
				 						$rootScope.markers.push(item);
				 					});
				 					$scope.markers_holder = $rootScope.markers;//creates a cache of the markers
					 			}	
				 			});		
				 		});
			 		} 
			 });	
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
		// if(type == 'keyword') {
		// 	$scope.keyword_results[index].showIndivMap = true;
		// }
		// else {
		// 	$scope.placesyoulike_results.showIndivMap = true;
		// }
		$scope.noMap=false;
		$rootScope.geolocation.together = $rootScope.markers[index].location.coordinate.latitude +', '+$rootScope.markers[index].location.coordinate.longitude;
		$rootScope.geolocation.lat = $rootScope.markers[index].location.coordinate.latitude;
		$rootScope.geolocation.lon = $rootScope.markers[index].location.coordinate.longitude;
		$scope.markers_holder = $rootScope.markers; //creates a cache of the markers
		$rootScope.markers = [$rootScope.markers[index]];	
	}

	$scope.hideMap = function() {
		$scope.noMap = true;
		$scope.searching = false;
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

}])

.directive('dgMap',  function ($rootScope) {
	
 return {
	 restrict: 'AE',
     scope: { }, 
     transclude: true,

    link: function(scope, element, attr ) {
	    $rootScope.markers =[];
			$rootScope.geolocation={};
			$rootScope.geolocation.lat=0;
			$rootScope.geolocation.lon=0;
			$rootScope.geolocation.orig_lat=0;
			$rootScope.geolocation.orig_lon=0;
			$rootScope.geolocation.zoom=15;
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

    		if($rootScope.geolocation.orig_lat !== undefined && $rootScope.geolocation.orig_lat !== undefined &&$rootScope.geolocation.orig_lat !== 0 && $rootScope.geolocation.orig_lat !== 0) {
      		var circle = L.circle([$rootScope.geolocation.orig_lat, $rootScope.geolocation.orig_lon], 125, {
				    color: '#428bca',
				    fillColor: '#428bca',
				    fillOpacity: 0.15
					}).addTo(map); 	
					//map.panTo(new L.LatLng($rootScope.geolocation.orig_lat, $rootScope.geolocation.orig_lon));
				}

      	if($rootScope.markers.length>0)
      	{
      		markers =[];
      		var i =0
      		$rootScope.markers.forEach(function(marker) {
      		i++
					marker_content='<b>'+i+' <a href="'+marker.url+'" target="_blank">'+marker.name+'</a></b><br>'+marker.location.address[0]+'<br>'+marker.location.city+'<br><a href="tel://'+marker.display_phone+'">'+marker.display_phone+'</a><br><img src="'+marker.rating_img_url+'" alt="'+marker.rating+' stars">';
					markers.push(L.marker([marker.location.coordinate.latitude, marker.location.coordinate.longitude]).bindPopup(marker_content));
					});
       	}

	      map.animate=true;
				map._zoom = 13;
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
