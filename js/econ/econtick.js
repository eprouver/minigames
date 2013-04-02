self.addEventListener('message', function(e) {
	var economy = e.data;
	var $cycleLength = 10,
	$expansion = 0.5,
	$powerStep = 0.1,
	$attract ={
		individual: 0.5 ,
		market: 0.5,
		producer: 0.5,
		industry: 0.5
	};
	
	function onTick(item, arr){
				item.inProd = '';
				if(item.purchasePower < 0.001){
					item.remove = true;
					return;
				}
				
				if(item.purchasePower > $expansion){
					if(Math.random() < $attract[item.type]){
						item.purchasePower = $expansion / 2;
						item.currentRest = 0;
						item.divide = true;
					}
				}
			
				item.currentRest += item.purchasePower;
				
				if(item.currentRest >= item.rest){
				
					item.supplied = requestneeds(item);
				
					if(item.supplied){
						item.inWant = false;
						item.inProd = true;
						produce(item);
						item.currentRest = 0;
						item.purchasePower += $powerStep * 1.1;						
					}else{
						item.inWant = true;
						item.purchasePower -= $powerStep;
						item.currentRest = 0;
					}
				}
	};
			
	function requestneeds(item){
			
				function needavailable(v, type){				
					if(economy.supply[v.type][v.index] > 0){
						economy.needs[v.type][v.index] = Math.max((economy.needs[v.type][v.index] || 0) - 1, 0);
						return true;
					}else{
						economy.needs[v.type][v.index] = (economy.needs[v.type][v.index] || 0) + 1;
						return false;
					}					
				}
				
				for(var i = 0; i < item.needs.length; i++){
					if(!needavailable(item.needs[i], item.type)){						
						return false;
					}
				}
				
				for(var i = 0; i < item.needs.length; i++){
					economy.supply[item.needs[i].type][item.needs[i].index] -= 1;
				}
				return true;
	};
	
	function addProducts(type, index){
		
			switch(type){
				case 'labor':
				economy.supply.labor[index] = (economy.supply.labor[index] || 0) + 1;
				break;
				case 'commodity':
				economy.supply.commodity[index] = (economy.supply.commodity[index] || 0) + 1;
				break;
				case 'equipment':
				economy.supply.equipment[index] = (economy.supply.equipment[index] || 0) + 1;
				break;				
				case 'consumer':
				economy.supply.consumer[index] = (economy.supply.consumer[index] || 0) + 1;
				break;
			}
		
	};
			
	function produce(item){
		for(var i = 0; i < item.production.length; i++){
			economy.supply[item.production[i].type][item.production[i].index] += item.production[i].amount;
		}
	};
	
	for(var i = 0; i < economy.individuals.length; i++){
		onTick(economy.individuals[i]);
	}
	for(var i = 0; i < economy.industries.length; i++){
		onTick(economy.industries[i]);
	}
	for(var i = 0; i < economy.markets.length; i++){
		onTick(economy.markets[i]);
	}
	for(var i = 0; i < economy.producers.length; i++){
		onTick(economy.producers[i]);
	}
	
	function sorter(a, b){
		return b.purchasePower - a.purchasePower;
	};
					
	economy.individuals.sort(sorter);
	economy.industries.sort(sorter);
	economy.markets.sort(sorter);
	economy.producers.sort(sorter); 
	
	self.postMessage({
		individuals: economy.individuals,
		industries: economy.industries,
		markets: economy.markets,
		producers: economy.producers,
		supply: economy.supply,
		needs: economy.needs,
		id: economy.id
	});
}, false);