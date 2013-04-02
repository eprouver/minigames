
var econ = angular.module('econ', ['ng']);

econ.directive('test', function(){
	return{
			restrict: 'E',
			template: '<div>hello</div>',
			controller: function($scope, $element){
			}
			
	}
});