var $cycleLength = 10,
$expansion = 0.5,
$powerStep = 0.1,
$attract ={
	individual: 0.5 ,
	market: 0.5,
	producer: 0.5,
	industry: 0.5
},
$templatePath = 'js/econ/temp/';

var econ = angular.module('econ', ['ng']).config(function($provide, $compileProvider){

$provide.factory('economy', function factory($rootScope){

	var $econtick;

	if(typeof(Worker)!=="undefined"){

		$econtick = new Worker('js/econ/econtick.js');
	}
	else{
	  
	}

	var economy = {
		//In a closed economy production releases goods back into the economy when it leaves
		closed: false,
		size: 0,
		inWant: 0,
		data: {
			health: []
		},
		worker: $econtick,
		runtick: function(){
				var $this = this;
					
				function process(){
					var whole = [].concat($this.individuals, $this.industries, $this.markets, $this.producers);
					$this.size = whole.length;
					$this.inWant = 0;
					for(var i = 0; i < whole.length; i++){
						whole[i].onTick();
						if(whole[i].inWant){
							$this.inWant++;
						}
					}

					function sorter(a, b){
						return b.purchasePower - a.purchasePower;
					};
					
					$this.individuals.sort(sorter);
					$this.industries.sort(sorter);
					$this.markets.sort(sorter);
					$this.producers.sort(sorter); 
				}
				
				if(typeof(Worker)!=="undefined"){	
					
					var whole = [].concat($this.individuals, $this.industries, $this.markets, $this.producers);
					$this.size = whole.length;
					$this.inWant = 0;
					for(var i = 0; i < whole.length; i++){
						if(whole[i].divide){
							whole[i].divide = false;
							this.addProduction(whole[i].type, whole[i].needs, whole[i].production);
						}
						
						if(whole[i].remove){
							this.removeProduction(whole[i]);
						}
						
						if(whole[i].inWant){
							$this.inWant++;
						}
					}
					this.addProduction(this.type, this.needs, this.production);
					
					try{

					$econtick.postMessage({
						individuals: $this.individuals,
						industries: $this.industries,
						markets: $this.markets,
						producers: $this.producers,
						needs: $this.needs,
						supply: $this.supply,
						id: $this.$id
					});
					}catch(e){
						console.log(e, {
						individuals: $this.individuals,
						industries: $this.industries,
						markets: $this.markets,
						producers: $this.producers,
						needs: $this.needs,
						supply: $this.supply
					});
					}
					
					if($econtick.onmessage == null){
						$econtick.addEventListener('message', function(e) {
							if(e.data.id === $this.$id){
						
								$this.individuals = e.data.individuals;
								$this.industries = e.data.industries;
								$this.markets = e.data.markets;
								$this.producers = e.data.producers;
								$this.needs = e.data.needs;
								$this.supply = e.data.supply;
							}
						}, false);
						$econtick.onmessage = true;
					}					
				}
				else{
					process();
				}				
					
		},
		range: 40,
		individuals: [],
		industries: [],
		markets: [],
		producers: [],
		supply:{
			labor: [0],
			commodity: [0],
			equipment: [0],
			consumer: [0]
		},
		needs: {
			labor: [0],
			commodity: [0],
			equipment: [0],
			consumer: [0]
		},
		viewrange: [],
		lastrange: function(){
		
		return this.data.health.slice(Math.max(this.data.health.length - this.range, 0));
		},
		addDataPoint: function(){
		
			//this.health.push(this.size * (this.size / (this.inWant || 1)));
			this.data.health.push(this.size - (this.size * ((this.inWant ||1) / (this.size || 1))));
			this.viewrange = this.lastrange();
		
		},
		addProducts: function(type, index){
		
			switch(type){
				case 'labor':
				this.supply.labor[index] = (this.supply.labor[index] || 0) + 1;
				break;
				case 'commodity':
				this.supply.commodity[index] = (this.supply.commodity[index] || 0) + 1;
				break;
				case 'equipment':
				this.supply.equipment[index] = (this.supply.equipment[index] || 0) + 1;
				break;				
				case 'consumer':
				this.supply.consumer[index] = (this.supply.consumer[index] || 0) + 1;
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
			
			if(Math.random() < 0.4){  //Likelyhood of reinvestment
				for(var i = 0; i < prod.needs.length; i++){
						this.supply[prod.needs[i].type][prod.needs[i].index] += prod.needs[i].amount ;
				}
				if(this.closed){ //If the economy is closed also remove the investment capital
					for(var i = 0; i < prod.production.length; i++){
							this.suppy[prod.production[i].type][prod.production[i].index] -= prod.production[i].amount ;
					}
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
			
			if(typeof(Worker)=="undefined"){

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
						}else{
							this.inWant = true;
							this.purchasePower -= $powerStep;
							this.currentRest = 0;
						}
					}
				}
				
				transfer.requestneeds = function(){
				
					function needavailable(v, economy, type){
					
						if(economy.supply[v.type][v.index] > 0){
							economy.needs[v.type][v.index] = Math.max((economy.needs[v.type][v.index] || 0) - 1, 0);
							return true;
						}else{
							economy.needs[v.type][v.index] = (economy.needs[v.type][v.index] || 0) + 1;
							return false;
						}
						
					}
					
					for(var i = 0; i < this.needs.length; i++){
						if(!needavailable(this.needs[i], this.economy, this.type)){
							
							return false;
						}
					}
					
					for(var i = 0; i < this.needs.length; i++){
						this.economy.supply[this.needs[i].type][this.needs[i].index] -= 1;
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
	
	
	$rootScope.economies.push(economy);
	return economy;
	
	});
	
	$provide.factory('worldclock', function($rootScope){
	
		return {
			time: 200,
			min: 1,
			max: 500,
			datapoint: 0,
			datapointdelta: 50,
			progress: 0,
			tick: function(){
				try{
					var attr = {
						datapoint: false
					};
				
					if(this.datapoint <= 0){
						attr.datapoint = true;
						this.datapoint = this.datapointdelta;
						$rootScope.$broadcast('datapoint');
					}
					
					this.datapoint --;
					
					this.progress = (((this.datapoint / this.datapointdelta)*10) % 10) | 0;
				
					$rootScope.$broadcast('clocktick', attr);
					
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
					var $this = this;
					this.interval = setInterval(function(){
						$this.tick();
					}, this.max -this.time);
				}			
			},
			start: function(){
				if(this.interval){
					clearInterval(this.interval);
					delete this.interval;
				}
					var $this = this;
					this.interval = setInterval(function(){
						$this.tick();
					}, this.max -this.time);			}
		}
	
	});
	
	$compileProvider.directive('local', ['economy',  function factory(economy){
	return{
		restrict: 'E',
		scope: true,
		templateUrl: $templatePath + "local.html",
		link: function($scope, $element){
			$scope.economy = angular.copy(economy);
			$scope.economy.$id = $scope.$id;
			$scope.individuals = 1;
			$scope.industry = 1;
			$scope.market = 1;
			$scope.produce = 1;
			
			$scope.$on('clocktick', function(e, data){

				$scope.economy.runtick();
				
				if(data.datapoint){
					$scope.economy.addDataPoint();
				}
				
				$scope.$apply();

			});
			
			$scope.generateActors = function(){
				$scope.economy.supply.labor = [5];
				$scope.economy.supply.commodity = [5];
				$scope.economy.supply.equipment = [5];
				$scope.economy.supply.consumer = [5];
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
			
			$scope.generateActors();
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
			template: ['<div class="btn btn-mini"><i ng-class="icon"></i> {{ getrest() }}','</div>'].join(''),
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

$compileProvider.directive('linegraph', function(){

	return {
		restrict: 'E',
		replace: true,
		template: '<div class="linegraph"></div>',
		link: function($scope, $element){
		var width = 600, height = 100;
					
		// create an SVG element inside the #graph div that fills 100% of the div
		var graph = d3.select($element[0]).append("svg:svg").attr("width", "100%").attr("height", "100px"),
 
		// create a simple data array that we'll plot with a line (this array represents only the Y values, X will just be the index location)
		data = [],
		// X scale will fit values from 0-10 within pixels 0-100
		x = d3.scale.linear().domain([0, 50]).range([-5, width]), // starting point is -5 so the first value doesn't show and slides off the edge as part of the transition
		// Y scale will fit values from 0-10 within pixels 0-100
		y = d3.scale.linear().domain([0, 100]).range([5, height]);
 
		// create a line object that represents the SVN line we're creating
		var line = d3.svg.line()
			// assign the X function to plot our line as we wish
			.x(function(d,i) { 
				return x(i); 
			})
			.y(function(d) { 
				return 100-y(d); 
			})
			.interpolate('linear')
	
			// display the line by appending an svg:path element with the data line we created above
			graph.append("svg:path").attr("d", line(data));
			
			$scope.drawgraph = function(){
				var data = JSON.parse($element.attr('data'));
				y.domain([0, Math.max.apply(Math, data) + 100]);
				graph.selectAll('path').attr("d", line(data));
				
				if(data.length >= 40){
					graph.selectAll('path').attr("transform", "translate(" + (x(1)) + ")") // set the transform to the right by x(1) pixels (6 for the scale we've set) to hide the new value
					 // apply the new data values ... but the new value is hidden at this point off the right of the canvas
					.transition() // start a transition to bring the new value into view
					.ease("linear")
					.duration(1000) // for this demo we want a continual slide so set this to the same as the setInterval amount below
					.attr("transform", "translate(" + x(0) + ")"); // animate a slide to the left back to x(0) pixels to reveal the new value
					}
					
					
			}
			

			$scope.$on('datapoint', function(){
				$scope.drawgraph();
			});
		
		}
		
	
	
	}

});




}).run(function($rootScope, worldclock){
	$rootScope.worldclock = worldclock;
	$rootScope.economies = [];

});





