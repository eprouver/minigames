var $cycleLength = 10,
$expansion = 0.5,
$powerStep = 0.1,
$attract ={
	individual: 0.5 ,
	market: 0.5,
	producer: 0.5,
	industry: 0.5
}


var econ = angular.module('econ', ['ng']).config(function($provide, $compileProvider){

$provide.factory('economy', function factory($rootScope){

	return {
		//In a closed economy production releases goods back into the economy when it leaves
		individuals: [],
		industries: [],
		markets: [],
		producers: [],
		labor: [],
		commodity: [],
		equipment: [],
		consumer: [],
		needs: {
			labor: [0],
			commodity: [0],
			equipment: [0],
			consumer: [0]
		},
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
			arr = this.industries;
			break;
			case 'market':
			arr = this.markets;
			break;
			case 'producer':
			arr = this.producers;
			break;
			}
			
			arr.splice(arr.indexOf(prod), 1);
			
			if(Math.random() > $attract[prod.type]){
				for(var i = 0; i < prod.production.length; i++){
						this[prod.production[i].type][prod.production[i].index] --;
				}
				for(var i = 0; i < prod.needs.length; i++){
						this[prod.needs[i].type][prod.needs[i].index] ++;
				}
			}
			
		},
		addProduction: function(type, needs, production){
			var transfer = {};
			transfer.type = type;
			transfer.needs = needs;
			transfer.production = production;
			transfer.rest = $cycleLength;
			transfer.currentRest = 0;
			transfer.purchasePower = Math.random()/10 + 0.1;
			transfer.supplied = false;
			transfer.economy = this;
			
			transfer.onTick = function(){
				this.inProd = '';
				if(this.purchasePower < 0.001){
					this.economy.removeProduction(this);
				}
				
				if(this.purchasePower > $expansion){
					if(Math.random() < $attract[this.type]){
						this.purchasePower = $expansion / 2;
						this.currentRest = 0;
						this.economy.addProduction(this.type, this.needs, this.production);
					}
						return true;
				}
			
				this.currentRest += this.purchasePower;
				
				if(this.currentRest >= this.rest){
				
					this.supplied = this.requestneeds();
				
					if(this.supplied){
						this.inWant = false;
						this.inProd = true;
						this.produce();
						this.currentRest = 0;
						this.purchasePower += $powerStep * 1.1;						
						return true;
					}else{
						this.inWant = true;
						this.purchasePower -= $powerStep;
						this.currentRest = 0;
						return false;
					}
				}
				
				return false;
			}
			
			transfer.requestneeds = function(){
			
				function needavailable(v, economy, type){
				
					if(economy[v.type][v.index] > 0){
						economy.needs[v.type][v.index] = Math.max((economy.needs[v.type][v.index] || 0) - 1, 0);
						return true;
					}else{
						economy.needs[v.type][v.index] = (economy.needs[v.type][v.index] || 0) + 1;
						console.log(v.type, 'needed by', type);
						return false;
					}
					
				}
				
				for(var i = 0; i < this.needs.length; i++){
					if(!needavailable(this.needs[i], this.economy, this.type)){
						
						return false;
					}
				}
				
				for(var i = 0; i < this.needs.length; i++){
					this.economy[this.needs[i].type][this.needs[i].index] -= 1;
				}
				
				return true;

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
			case 'market':
			this.markets.push(transfer);
			break;
			case 'industry':
			this.industries.push(transfer);
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
		generateMarket: function(){
			this.addProduction('market', [
				{'type': 'labor', 'index': 0, 'amount':1}, 
				{'type': 'commodity', 'index': 0, 'amount':1}],
				[{'type': 'consumer', 'index': 0, 'amount':2}]);	
		},
		generateIndustry: function(){
			this.addProduction('industry', [
				{'type': 'labor', 'index': 0, 'amount':1}, 
				{'type': 'commodity', 'index': 0, 'amount':1}],
				[{'type': 'equipment', 'index': 0, 'amount':1},
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
			time: 200,
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
			change: function(){
				if(this.interval){
					clearInterval(this.interval);
					this.interval = setInterval(this.tick, this.time);
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
	
	$compileProvider.directive('economy', ['economy', 'worldclock', function factory(economy, worldclock){
	return{
		restrict: 'C',
		scope: true,
		link: function($scope, $element){
			$scope.worldclock = worldclock;
			$scope.economy = angular.copy(economy);
			$scope.individuals = 1;
			$scope.industry = 1;
			$scope.market = 1;
			$scope.produce = 1;
			
			$scope.$on('clocktick', function(){
				
					var whole = [].concat($scope.economy.individuals, $scope.economy.industries, $scope.economy.markets, $scope.economy.producers)
					for(var i = 0; i < whole.length; i++){
						whole[i].onTick();
					}
				
					
					function sorter(a, b){
						return b.purchasePower - a.purchasePower;
					
					}
					
					$scope.economy.individuals.sort(sorter);
					$scope.economy.industries.sort(sorter);
					$scope.economy.markets.sort(sorter);
					$scope.economy.producers.sort(sorter);
					
					$scope.$apply();

			});
			
			$scope.generateActors = function(){
				$scope.economy.labor = [5];
				$scope.economy.commodity = [5];
				$scope.economy.equipment = [5];
				$scope.economy.consumer = [5];
				$scope.economy.individuals = [];
				$scope.economy.industries = [];
				$scope.economy.markets = [];
				$scope.economy.producers = [];
				$scope.economy.needs = {
					labor: [0],
					commodity: [0],
					equipment: [0],
					consumer: [0]
				};
			
				var i = 0;
				for(i = 0; i < $scope.individuals; i++){
					$scope.economy.generateIndividual();
				}

				for(i = 0; i < $scope.industry; i++){
					$scope.economy.generateIndustry();
				}

				for(i = 0; i < $scope.market; i++){
					$scope.economy.generateMarket();
				}				

				for(i = 0; i < $scope.produce; i++){
					$scope.economy.generateProducer();
				}
			}
		}
	}
}]);


$compileProvider.directive('localprod', ['worldclock', function(worldclock){
	var icons = {
		'individual': "icon-home",
		'industry': "icon-briefcase",
		'market': "icon-tag",
		'producer': "icon-th"
	}

	return{
			restrict: 'E',
			replace: true,
			scope: true,
			template: ['<div class="btn btn-mini" ng-click="worldclock.toggle()"><i ng-class="icon"></i> {{ getrest() }}','</div>'].join(''),
			controller: function($scope, $element){
				$scope.icon = icons[$element.attr('data-type')];
				$scope.prodClass = '';
			
				$scope.getrest = function(){

					var item = $scope.item, rest;
					
					if(item.purchasePower > $expansion * 0.75){ 
						rest = 'X';
					}else{
						rest = (((item.rest - item.currentRest) / item.rest) * 10).toFixed('0');
						if(rest === '10') rest = 0;
					}
					item.inWant? $scope.wantClass = 'inWant' : $scope.wantClass = '';
					item.inProd? $scope.prodClass = 'inProd' : $scope.prodClass = '';
					
					return rest;
				}

			}
	}
}]);

$compileProvider.directive('good', function(){
	var icons = {
		labor: "icon-time",
		commodity: "icon-tint",
		equipment: "icon-wrench",
		consumer: "icon-shopping-cart"
	}

	return{
			restrict: 'E',
			replace: true,
			template: '<div class="btn"><i ng-class="icon"></i> {{item}}</div>',
			controller: function($scope, $element){
				$scope.icon = icons[$element.attr('data-type')];
			}
	}
});




}).run(function(worldclock){


});





