var app = angular.module("app", ["ngRoute"])
	.config(function($routeProvider) {
		$routeProvider
			.when("/", {
				redirectTo: "/queue"
			})
			.when("/queue", {
				templateUrl: "partials/queue.html",
				controller: "QueueController"
			})
			.when("/search", {
				templateUrl: "partials/search.html",
				controller: "SearchController"
			})
			.otherwise({redirectTo: "/queue"})
	})
	.controller("HeaderController", function($scope, $location){
		$scope.isActive = function(viewLocation) {
			return viewLocation === $location.path();
		}
	})	
	.factory("queueModel", function(){
		return {message: "default"};
	})
	.controller("QueueController", function($scope, queueModel) {
		$scope.model = queueModel;
	})
	.factory("searchModel", function(){
		return { 
			nextPageToken: "",
			searchTerm: "",
			searchResults: []
		};
	})
	.controller("SearchController", function($scope, $http, searchModel) {
		console.log(searchModel);
		$scope.apiKey = "AIzaSyDqk9YFOP4S9UBoB9deU7CoNrDdfclh_QQ";
		$scope.model = searchModel;

		$scope.search = function() {
			$scope.model.nextPageToken = "";
			$scope.model.searchResults = [];
			$scope.loadNextItem();
		};

		$scope.getSearchUrl = function(query) {
			return "https://www.googleapis.com/youtube/v3/search?part=snippet" +
			"&q="+query+"&type=video&videoCategoryId=10&key="+$scope.apiKey+
			(!$scope.model.nextPageToken ? "" : "&pageToken=")+$scope.model.nextPageToken;
		}

		$scope.getDetailUrl = function(ids) {
			return "https://www.googleapis.com/youtube/v3/videos?part=snippet%2CcontentDetails%2Cstatistics" +
			"&id="+ids+"&key="+$scope.apiKey;
		}

		$scope.loadNextItem = function() {
			$("#searchBar").blur();
			$("#loadingMessage").show();
			console.log("Loading more items.");
			$http.get($scope.getSearchUrl($scope.model.searchTerm)).
				success(function(data, status, headers, config) {
					console.log("Success in search");
					console.log(data);
					console.log(status);
					console.log(headers);
					console.log(config);

					// set the next page token 
					$scope.model.nextPageToken = data.nextPageToken;

					// no results to show, we're done
					if(data.items.length == 0) {
						$("#loadingMessage").hide();
						return;
					}

					var ids = "";
					angular.forEach(data.items, function(result) {
						ids += result.id.videoId + ",";
					});

					$http.get($scope.getDetailUrl(ids)).
						success(function(data, status, headers, config) {
							console.log("Success in details");
							console.log(data);
							console.log(status);
							console.log(headers);
							console.log(config);

							angular.forEach(data.items, function(item) {
								$scope.model.searchResults.push({
									thumbnailUrl: item.snippet.thumbnails.default.url,
									title: item.snippet.title,
									duration: item.contentDetails.duration.replace("PT","").replace("H",":").replace("M",":").replace("S",""),
									views: item.statistics.viewCount
								});
							});
							$("#loadingMessage").hide();
						}).
						error(function(data, status, headers, config) {
							$("#loadingMessage").hide();
							console.log("Error in details");
							console.log(data);
							console.log(status);
							console.log(headers);
							console.log(config);		
						});
				}).
				error(function(data, status, headers, config) {
					$("#loadingMessage").hide();
					console.log("Error in search");
					console.log(data);
					console.log(status);
					console.log(headers);
					console.log(config);
				});
		};

		$scope.clearSearchResults = function() {
			$scope.model.searchTerm = "";
			$scope.model.searchResults = [];
		};

		$scope.queueVideo = function(result) {
			console.log("Queuing video");
			console.log(results);
		};
		
	});

$(window).scroll(function() {
   if($(window).scrollTop() + $(window).height() == $(document).height()) {
       $("#loadNextItem").click();
   }
});