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
		});
		
		$scope.scrambleElement = function(){
			var elements = $('#shredholder').children();
			
			for(var i = 0; i < 10; i++){
			
				$(elements[~~(Math.random() * elements.length)]).insertAfter(elements[~~(Math.random() * elements.length)]);
			
			}
		};
		
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
			
				$scope.$apply(function(){
					$scope.finished = true;
				});	
				alert('finished');
		});
		
		function searchComplete(){

			$.each($scope.imageSearch.results, function(i,v){
				var transfer = new Image();
				
				transfer.onload = function(){
				
					$scope.images.push( {
						url: this.src, 
						width: this.width,
						height: this.height,
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
			google.search.ImageSearch.IMAGESIZE_MEDIUM );

        $scope.imageSearch.setSearchCompleteCallback(this, searchComplete, null);

		var terms = ["legal","important","identification","id","identify","identity","pictures","holder","object",
		"identifier","keys","sticker","reports","communication","picture","isolated","official","holiday","immigration","contracts","invoices","bids","newsletters"];


        $scope.imageSearch.execute('documents ' + terms[~~(Math.random() * terms.length)] + ' ' + terms[~~(Math.random() * terms.length)]);
		google.search.Search.getBranding('branding');
		
		$scope.addimage = function(){
			$scope.imageSearch.execute('legal document');
		}
		

		
		
		
		}
	}
})