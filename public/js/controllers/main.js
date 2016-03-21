var Doppleganger = angular.module('Doppleganger', ['ngRoute']);
angular.module('Ganger', [])


	// inject the Todo service factory into our controller
	// .controller('mainController', ['$scope','$http','Todos', function($scope, $http, Todos) {
	// 	$scope.formData = {};
	// 	$scope.loading = true;

	// 	// GET =====================================================================
	// 	// when landing on the page, get all todos and show them
	// 	// use the service to get all the todos
	// 	Todos.get()
	// 		.success(function(data) {
	// 			$scope.todos = data;
	// 			$scope.loading = false;
	// 		});

	// 	// CREATE ==================================================================
	// 	// when submitting the add form, send the text to the node API
	// 	$scope.createTodo = function() {

	// 		// validate the formData to make sure that something is there
	// 		// if form is empty, nothing will happen
	// 		if ($scope.formData.text != undefined) {
	// 			$scope.loading = true;

	// 			// call the create function from our service (returns a promise object)
	// 			Todos.create($scope.formData)

	// 				// if successful creation, call our get function to get all the new todos
	// 				.success(function(data) {
	// 					$scope.loading = false;
	// 					$scope.formData = {}; // clear the form so our user is ready to enter another
	// 					$scope.todos = data; // assign our new list of todos
	// 				});
	// 		}
	// 	};

	// 	// DELETE ==================================================================
	// 	// delete a todo after checking it
	// 	$scope.deleteTodo = function(id) {
	// 		$scope.loading = true;

	// 		Todos.delete(id)
	// 			// if successful creation, call our get function to get all the new todos
	// 			.success(function(data) {
	// 				$scope.loading = false;
	// 				$scope.todos = data; // assign our new list of todos
	// 			});
	// 	};
	// }])

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
	Geolocation.checkGeolocation().then(function(data){
		if(data!==false)
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
		SearchYelp.searchYelp(searchterms, location).then(function(result){
		 		$scope.keyword_results =result.businesses; 
		 });
	}
	
	$scope.runBusinessSearch = function(searchterms, location, destination) {
		SearchYelp.searchYelp(searchterms, location).then(function(result){
		 		var id =result.businesses[0].id
		 		SearchYelp.searchYelpBusiness(id).then(function(data){
		 			var length = data.categories[0].length;
		 			var categoriesStr = ''
		 			data.categories.forEach(function(item) {
		 				categoriesStr+= item[0]+' '
		 			})
		 			SearchYelp.searchYelp(categoriesStr, destination).then(function(moredata){
		 				$scope.placesyoulike_results = moredata.businesses;
		 			});
		 		}); 
		 });	
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