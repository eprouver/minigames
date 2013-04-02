google.load("search", "1");

var conspiracy = angular.module('conspiracy', ['ng']).run(function($rootScope){

});

conspiracy.directive('sortholder', function(){
	return{
	restrict: 'C',
	link: function($scope, $element){
			$($element).sortable({
				
			});
	}
	}
});


conspiracy.directive('shredder', function($rootScope){
	return{
		restrict: 'E',
		scope: true,
		transclude: true,
		replace: true,
		templateUrl: 'js/conspiracy/shredder.html',
		link: function($scope, $element){},
		controller: function($scope, $element){
		$($element).one('imageAdded', function(){
				$scope.$apply(function(){
					$scope.shredder = $scope.images[0];
				});	
				$scope.scrambleElement();
		});
		
		$scope.scrambleElement = function(){
			var elements = $('#shredholder').children();
			
			for(var i = 0; i < 20; i++){
			
				$(elements[~~(Math.random() * elements.length)]).insertAfter(elements[~~(Math.random() * elements.length)]);
			
			}
		};
		
		$scope.nextImage = function(){
			if($scope.images.length === 0) return;
			
			$scope.anotherdoc = 'searching';
			var trans = $scope.images[~~(Math.random() * $scope.images.length)];
			if(trans.url == $scope.shredder.url){
				$scope.anotherdoc = 'Failed';
				return false;
			}
			$scope.anotherdoc = 'SUCCESS';
			$scope.shredder = trans;
			$scope.scrambleElement();
			if(!$scope.$$phase)
				$scope.$apply();
			return true;
		};
		
		$scope.searchagain = function(){
			$($element).one('imageAdded', function(){
				$scope.nextImage();
			});
			
			$scope.runsearch();
		};
		
		function searchComplete(){

			$.each($scope.imageSearch.results, function(i,v){
				var transfer = new Image();
				
				transfer.onload = function(){
				
					if(this.width > 800) return;
				
					$scope.images.push( {
						url: this.src, 
						width: this.width,
						height: this.height,
						points: this.width * 10,
						shreds: new Array(~~(this.width / 40))
					});

					$($element).trigger('imageAdded');
				};
				transfer.src = v.url;
				
			});

		}
		$scope.images = [];
		
		$scope.imageSearch = new google.search.ImageSearch();
		$scope.imageSearch.setRestriction(
			google.search.ImageSearch.RESTRICT_IMAGESIZE,
			google.search.ImageSearch.IMAGESIZE_Medium );

        $scope.imageSearch.setSearchCompleteCallback(this, searchComplete, null);

		$scope.runsearch = function(){
			var terms = ["legal","important","identification","id","identify","identity","pictures","scandal","washington", "coverup", "conspiracy",
			"crime","communism","terrorism","report","communication","aliens","political","official","immigration","contracts","invoice","bids","newsletter",
			"protest", "New World Order", "newspaper","bank"];

			$scope.imageSearch.execute('documents ' + terms[~~(Math.random() * terms.length)] + ' ' + terms[~~(Math.random() * terms.length)]);
		}
		
		$scope.runsearch();
		google.search.Search.getBranding('branding');
		
		$element.find('#shredholder').on('sortstop', function(e,ui){
			var array = $(ui.item).parent().sortable('serialize').replace(/a\[\]=/gi,'').split('&');
			
			for(var i = 1; i < array.length; i++){
				if(parseInt(array[i-1]) < parseInt(array[i])){
					continue;
				}else{
				$scope.$apply(function(){
					$scope.finished = false;
				});
					
					return;
				}
			}
			
				alert('finished');
				for(var i = 0; i < $scope.images.length; i++){
					if($scope.shredder == $scope.images[i]){
					$scope.images.splice(i,1);
					break;
					}
				}
				
				if($scope.images.length == 0){
					alert('all Done!');
					$scope.shredder = {};
					$scope.$apply();
					return;
				}
				var next = false;
				
				while(!next){
					next = $scope.nextImage();
				}
				
				$scope.$apply();
		});
		

		}
	}
})