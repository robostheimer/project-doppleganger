var Doppleganger = angular.module('Doppleganger', ['ngRoute']);
angular.module('todoController', [])


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
				return $http.get('/api/yelp/search/?term='+searchterms+'&location='+location+'&limit=20').then(function(result) {
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


.controller('getYelpResults', ['$scope','$http','SearchYelp', function($scope, $http, SearchYelp) {	 

	$scope.places = false;
	$scope.keywords = false;

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
		 			console.log(categoriesStr, destination)
		 			SearchYelp.searchYelp(categoriesStr, destination).then(function(moredata){
		 				$scope.placesyoulike_results = moredata.businesses;
		 				console.log($scope.placesyoulike_results)
		 			});
		 		}); 
		 });	
	}
	$scope.showKeywords = function() {
		$scope.places = false;
		$scope.keywords = true;

	}

	$scope.showPlaces = function() {
			$scope.places = true;
		$scope.keywords = false;
	}

}]);		