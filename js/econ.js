
var econ = angular.module('econ', ['ng']).config(function($provide, $compileProvider){

$provide.factory('economy', function factory($rootScope){

	return {
		individuals: [],
		businesses: [],
		producers: [],
		labor: [],
		commodity: [],
		equipment: [],
		consumer: [],
		addProducts: function(type, index){
		
			switch(type){
				case 'labor':
				this.labor[index] = (this.labor[index] || 0) + 1;
				break;
				case 'commodity':
				this.commodity[index] = (this.commodity[index] || 0) + 1;
				break;
				case 'equipment':
				this.equipment[index] = (this.equipment[index] || 0) + 1;
				break;				
				case 'consumer':
				this.consumer[index] = (this.consumer[index] || 0) + 1;
				break;
			}
		
		},
		removeProduction: function(prod){
			var arr;
			
			switch(prod.type){
			case 'individual':
			arr = this.individuals;
			break;
			case 'industry':
			case 'commerce':
			arr = this.businesses;
			break;
			case 'producer':
			arr = this.producers;
			break;
			}
			
			arr.splice(arr.indexOf(this), 1);
			
		},
		addProduction: function(type, needs, production, supplied){
			var transfer = {};
			transfer.type = type;
			transfer.needs = needs;
			transfer.production = production;
			transfer.rest = 10;
			transfer.currentRest = 0;
			transfer.purchasePower = Math.random();
			transfer.supplied = supplied || false;
			transfer.economy = this;
			
			transfer.onTick = function(){
				if(this.purchasePower < 0){
					this.economy.removeProduction(this);
				}
			
				this.currentRest += this.purchasePower;
				
				if(this.currentRest >= this.rest){
				
					this.requestneeds();
				
					if(this.supplied){
						this.produce();
						this.currentRest = 0;
						this.purchasePower += 0.11;
						return true;
					}else{
						this.purchasePower -= 0.11;
						return false;
					}
				}
				
				return false;
			}
			
			transfer.requestneeds = function(){
			
				if(Math.random() > 0.3){
					this.supplied = true;
				}else{
					this.supplied = false;
				}

			}
			
			transfer.produce = function(){
				for(var i = 0; i < this.production.length; i++){
					for(var j = 0; j < this.production[i].amount; j++){
						this.economy.addProducts(this.production[i].type, this.production[i].index);
					}
				}

			}
			
			switch(type){
			case 'individual':
			this.individuals.push(transfer);
			break;
			case 'commerce':
			case 'industry':
			this.businesses.push(transfer);
			break;
			case 'producer':
			this.producers.push(transfer);
			break;
			}
		
		},
		generateIndividual: function(){
			this.addProduction('individual', [
				{'type': 'consumer', 'index': 0, 'amount':1}],
				[{'type': 'labor', 'index': 0, 'amount':1}]);
		},
		generateConsumerBusiness: function(){
			this.addProduction('commerce', [
				{'type': 'labor', 'index': 0, 'amount':1}, 
				{'type': 'commodity', 'index': 0, 'amount':1}, 
				{'type': 'equipment', 'index': 0, 'amount':1}],
				[{'type': 'equipment', 'index': 0, 'amount':1},
				{'type': 'consumer', 'index': 0, 'amount':2}]);	
		},
		generateIndustrialBusiness: function(){
			this.addProduction('industry', [
				{'type': 'labor', 'index': 0, 'amount':1}, 
				{'type': 'commodity', 'index': 0, 'amount':1}, 
				{'type': 'equipment', 'index': 0, 'amount':1}],
				[{'type': 'equipment', 'index': 0, 'amount':2},
				{'type': 'consumer', 'index': 0, 'amount':1}]);
		},
		generateProducer: function(){
			this.addProduction('producer', [
				{'type': 'labor', 'index': 0, 'amount':1}, 
				{'type': 'equipment', 'index': 0, 'amount':1}], 
				[{'type': 'commodity', 'index': 0, 'amount':2}]);
		}
	}
	
	});
	
	$provide.factory('worldclock', function($rootScope){
	
		return {
			time: 100,
			tick: function(){
				try{
					$rootScope.$broadcast('clocktick');
				}catch(e){

				}
			},
			toggle: function(){
				if(this.interval){
					clearInterval(this.interval);
					delete this.interval;
				}else{
					this.start()
				}
			},
			stop: function(){
				if(this.interval){
					clearInterval(this.interval);
					delete this.interval;
				}
			},
			start: function(){
				if(this.interval){
					clearInterval(this.interval);
					delete this.interval;
				}
				this.interval = setInterval(this.tick, this.time);
			}
		}
	
	});
	
	$compileProvider.directive('economy', ['economy', function factory(economy){
	return{
		restrict: 'C',
		scope: true,
		link: function($scope, $element){
			$scope.economy = angular.copy(economy);
			
			//Generate Actors
			var i = 0;
			for(i = 0; i < 2 + Math.random() * 30; i++){
				$scope.economy.generateIndividual();
			}

			for(i = 0; i < 2 + Math.random() * 30; i++){
				$scope.economy.generateIndustrialBusiness();
				$scope.economy.generateConsumerBusiness();
			}			

			for(i = 0; i < 2 + Math.random() * 30; i++){
				$scope.economy.generateProducer();
			}
		}
	}
}]);

$compileProvider.directive('onTick', ['worldclock', function(worldclock){

	return{
		restrict: 'C',
		controller: function($scope, $element){
		
			$element.on('click', function(){
				worldclock.toggle();
			});
		
			$scope.$on('clocktick', function(){
			
				if('item' in $scope){
					if('onTick' in $scope.item){
						$scope.$apply(function(){
							if($scope.item.onTick()){
								$element.clearQueue();
								$element.effect('highlight');
							}
						});
					}
				}
			
			});
		
		}
	}

}]);

$compileProvider.directive('individual', function(){
	return{
			restrict: 'E',
			replace: true,
			template: ['<div class="btn" ng-click="item.requestneeds()"><i class="icon-user"></i> {{((item.rest - item.currentRest)/item.rest)* 100 | number:0}}%','</div>'].join(''),
			controller: function($scope, $element){
			

			}
	}
});

$compileProvider.directive('business', function(){
	return{
			restrict: 'E',
			replace: true,
			template: ['<div class="btn"><i class="icon-briefcase"></i> {{((item.rest - item.currentRest)/item.rest)* 100 | number:0}}%','</div>'].join(''),
			controller: function($scope, $element){
			}
	}
});

$compileProvider.directive('producer', function(){
	return{
			restrict: 'E',
			replace: true,
			template: ['<div class="btn"><i class="icon-th"></i> {{((item.rest - item.currentRest)/item.rest)* 100 | number:0}}%','</div>'].join(''),
			controller: function($scope, $element){
			}
	}
});

$compileProvider.directive('labor', function(){
	return{
			restrict: 'E',
			replace: true,
			template: '<div class="btn"><i class="icon-wrench"></i> {{item}}</div>',
			controller: function($scope, $element){
			}
	}
});

$compileProvider.directive('commodity', function(){
	return{
			restrict: 'E',
			replace: true,
			template: '<div class="btn"><i class="icon-tint"></i> {{item}}</div>',
			controller: function($scope, $element){
			}
	}
});

$compileProvider.directive('equipment', function(){
	return{
			restrict: 'E',
			replace: true,
			template: '<div class="btn"><i class="icon-print"></i> {{item}}</div>',
			controller: function($scope, $element){
			}
	}
});

$compileProvider.directive('consumer', function(){
	return{
			restrict: 'E',
			replace: true,
			template: '<div class="btn"><i class="icon-shopping-cart"></i> {{item}}</div>',
			controller: function($scope, $element){
			}
	}
});


}).run(function(worldclock){

	worldclock.start();


});





