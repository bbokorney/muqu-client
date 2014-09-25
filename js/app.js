var app = angular.module("app", ["ngRoute", "timer", "youtube-embed"])
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
	.controller("HeaderController", function($scope, $location, queueModel){
		$scope.model = queueModel;
		$scope.isActive = function(viewLocation) {
			return viewLocation === $location.path();
		};
		$scope.time = "";

		// $scope.$on('timer-stopped')
		// (function poll() {
		// 	if(!$scope.time) {
		// 		$http.get("api/time")
		// 		.success(function(data, status, headers, config) {
		// 			console.log("Success in time");
		// 			console.log(data);
		// 			// console.log(status);
		// 			// console.log(headers);
		// 			// console.log(config);
		// 			$scope.model.queueList = data;
		// 		})
		// 		.error(function(data, status, headers, config) {
		// 			console.log("Error in Queue");
		// 			console.log(data);
		// 			console.log(status);
		// 			console.log(headers);
		// 			console.log(config);
		// 		});
		// 	} else {

		// 	}
			
		// 	$timeout(poll, 5000);
		// })();

	})	
	.factory("queueModel", function(){
		return {queueList: []};
	})
	.controller("QueueController", function($scope, $http, $timeout, queueModel) {
		console.log($scope);
		$scope.model = queueModel;
		(function poll() {
			$http.get("api/queue")
				.success(function(data, status, headers, config) {
					// console.log("Success in Queue");
					// console.log(data);
					// console.log(status);
					// console.log(headers);
					// console.log(config);
					$scope.model.queueList = data;
				})
				.error(function(data, status, headers, config) {
					console.log("Error in Queue");
					console.log(data);
					console.log(status);
					console.log(headers);
					console.log(config);
				});
			$timeout(poll, 3000);
		})();
	})
	.factory("searchModel", function(){
		return { 
			nextPageToken: "",
			endOfResults: false,
			searchTerm: "",
			searchResults: []
		};
	})
	.controller("SearchController", function($scope, $http, $location, searchModel) {
		console.log($scope);
		$scope.apiKey = "AIzaSyDqk9YFOP4S9UBoB9deU7CoNrDdfclh_QQ";
		$scope.model = searchModel;

		$scope.search = function() {
			$scope.model.nextPageToken = "";
			$scope.model.endOfResults = false;
			$scope.model.searchResults = [];
			$scope.loadNextItem();
		};

		$scope.resetTime = function() {
			$("timer")[0].start();
		};

		$scope.requestAuth = function() {
			console.log("Requesting auth");
			$http.post("api/auth")
				.success(function(data, status, headers, config) {
					console.log("Success getting auth");
				})
				.error(function(data, status, headers, config) {
					console.log("Error getting auth");
				});
		}

		$scope.getSearchUrl = function(query) {
			return "https://www.googleapis.com/youtube/v3/search?part=snippet" +
			"&q="+query+"&videoDuration=medium&type=video&videoCategoryId=10&key="+$scope.apiKey+
			(!$scope.model.nextPageToken ? "" : "&pageToken="+$scope.model.nextPageToken);
		};

		$scope.getDetailUrl = function(ids) {
			return "https://www.googleapis.com/youtube/v3/videos?part=snippet%2CcontentDetails%2Cstatistics%2Cstatus" +
			"&id="+ids+"&key="+$scope.apiKey;
		};

		$scope.loadNextItem = function() {
			if($scope.model.endOfResults) {
				return;
			}
			
			$("#searchBar").blur();
			// $("#loadingMessage").show();
			console.log("Loading more items.");
			$http.get($scope.getSearchUrl($scope.model.searchTerm)).
				success(function(data, status, headers, config) {
					console.log("Success in search");
					console.log(data);
					console.log(status);
					console.log(headers);
					console.log(config);

					// set the next page token 
					if(data.nextPageToken) {
						$scope.model.nextPageToken = data.nextPageToken;
						$scope.model.endOfResults = false;
					}
					else {
						$scope.model.endOfResults = true;
					}

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
								if(item.status.embeddable) {
									$scope.model.searchResults.push({
										id: item.id,
										thumbnailUrl: item.snippet.thumbnails.default.url,
										title: item.snippet.title,
										duration: item.contentDetails.duration.replace("PT","").replace("H",":").replace("M",":").replace("S",""),
										views: item.statistics.viewCount
									});
								}
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
			if($("#timer > span").text()) {
				console.log("Can't request yet");
				return;
			}
			console.log("Resetting time");
			$scope.resetTime();
			console.log(result);
			$http.post("/api/enqueue", {
				"id": result.id,
				"title": result.title
			})
			.success(function(data, status, headers, config) {
				console.log("enqueue success");
				console.log(data);
				console.log(status);
				console.log(headers);
				console.log(config);
				$location.path("/queue");
			})
			.error(function(data, status, headers, config) {
				console.log("enqueue fail");
				console.log(data);
				console.log(status);
				console.log(headers);
				console.log(config);
			});
		};
		
		$scope.requestAuth();
	})
	.controller("PlayerController", function($scope, $http, queueModel) {
		console.log("PlayerController");
		
		$scope.currentVideoId = "";
		$scope.currentVideoTitle = "";

		$scope.poller = {};

		$scope.dequeue = function() {
			if(queueModel.queueList.length == 0) {
				// poll until there is something in the queue
				$scope.poller = setInterval(function() {
					if(queueModel.queueList.length > 0) {
						clearInterval($scope.poller);
						$scope.dequeue();
					}
				}, 2000);
				return;
			}
			$http.post("api/dequeue")
				.success(function(data, status, headers, config) {
					console.log("Success in Dequeue");
					console.log(data);
					console.log(status);
					console.log(headers);
					console.log(config);
					$scope.currentVideoId = data.id;
					$scope.currentVideoTitle = data.title;
				})
				.error(function(data, status, headers, config) {
					console.log("Error in Dequeue");
					console.log(data);
					console.log(status);
					console.log(headers);
					console.log(config);
				});
		};

		$scope.$on("youtube.player.ready", function($event, player) {
			console.log("Player is ready");
			player.playVideo();
		});
		$scope.$on("youtube.player.ended", function($event, player) {
			console.log("Video has ended");
			// send a request to pop top of the queue
			// get back the id of the next video to player
			// change the id of the player
			$scope.dequeue();
			// start playing the video
			// or maybe not, maybe just change the id,
			// and possibly the ready event gets fired
		});
		$scope.dequeue();
	});

$(window).scroll(function() {
   if($(window).scrollTop() + $(window).height() == $(document).height()) {
       $("#loadNextItem").click();
   }
});

function onYouTubePlayerReady(playerid) {
	console.log("Player ready: ");
	console.log(playerid);
}