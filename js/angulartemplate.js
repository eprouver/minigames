
var econ = angular.module('econ', []);

econ.directive('test', function(){
	return{
			restrict: 'E',
			template: '<div>hello</div>',
			controller: function($scope, $element){
			}
			
	}
});