var Doppleganger = angular.module('Doppleganger', ['ngRoute']);
angular.module('Ganger', [])

.factory('SearchYelp', ['$http', 
	function($http) {
		return {
			searchYelp: function(searchterms, location) {
				return $http.get('/api/yelp/search/?term='+searchterms+'&location='+location+'&limit=10').then(function(result) {
					return result.data;
			});
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
						console.log(location)
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

.controller('getYelpResults', ['$scope','$http','SearchYelp', 'Geolocation', '$q',
	function($scope, $http, SearchYelp, Geolocation, $q) {	 
	$scope.places = true;
	$scope.keywords = false;
	$scope.placesButtonState ='off';
	$scope.keywordsButtonState ='on';
	$scope.addTypeahead = true;
	$scope.loading = true;
	$scope.noBusinesses = false;
	$scope.searching = false;
	Geolocation.checkGeolocation().then(function(data){
		if(data !== false)
		{
			$scope.geolocation = data.lat +', '+data.lon;
			$scope.whereyouare = data.city+', '+data.state;
			$scope.addTypeahead=true;
			$scope.loading=false
		}
		$scope.addTypeahead = false;
		$scope.loading=false
	});

	$scope.runSearch = function(searchterms, location) {
		$scope.keyword_results = [];
		$scope.noBusinesses=false;

		
		if((searchterms !== undefined && searchterms !== "") && (location !== undefined && location !== ""))
		{
			$scope.searching = true;

			SearchYelp.searchYelp(searchterms, location).then(function(result){
				if(result.businesses.length == 0)
	 			{
	 				$scope.noBusinesses=true;
	 				$scope.searching = false;
	 			}
	 			else {
			 	$scope.keyword_results =result.businesses; 
			 	$scope.searching = false;
				}
			});
		}
	}
	
	$scope.runBusinessSearch = function(searchterms, location, destination) {
		
		$scope.placesyoulike_results = [];
		$scope.noBusinesses=false
		
		
		if((searchterms !== undefined && searchterms !== "") && (location !== undefined && location !== "")  && (destination !== undefined && destination !== ""))
		{
			$scope.searching = true;

			SearchYelp.searchYelp(searchterms, location).then(function(result){
	 		if(result.businesses.length == 0)
	 			{
	 				$scope.noBusinesses=true;
	 				$scope.searching = false;
	 			}
	 			else {
			 		var id =result.businesses[0].id
			 		SearchYelp.searchYelpBusiness(id).then(function(data){
				 			var categoriesStr = ''
				 			data.categories.forEach(function(item) {
				 				categoriesStr+= item[0]+' '
				 			})
				 			SearchYelp.searchYelp(categoriesStr, destination).then(function(moredata){
				 				$scope.placesyoulike_results = moredata.businesses;
				 				$scope.searching = false;
				 			});
				 		});
			 		} 
			 });	
		}
	};

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

}]);		