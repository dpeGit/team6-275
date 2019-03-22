

const numBuildings = 6;

var gameData = {
		score: null,
		currency: null,
		building1: null,
		building2: null,
		building3: null,
		building4: null,
		building5: null,
		building6: null
};

var saveLoop = null;
var incomeLoop = null;

init();

window.onbeforeunload = function(){
		logout(false);
		return null;
};

function init(){
		$.ajax({
				type: 'POST',
				url:  'https://team6.dpeserver.me/load',
				success: function(res){
						if (res == 'init'){
								init();
						} else {
								console.log(res);
								gameData.score = parseInt(res.score);
								gameData.currency = parseInt(res.currency);
								for (var i = 1; i <= numBuildings; i++){
										gameData[`building${i}`] = parseInt(res[`building${i}`]);
								}
								saveLoop = setTimeout(save, 15 * 1000);
								updateScore();
								updateBuildings();
								updateIncome((calcIncome()*60).toFixed(2));
								incomeLoop = setInterval(() => incScore(calcIncome()), 16);
						}
				}
		});
}

function save(){
		$.ajax({
				type: 'POST',
				url:  'https://team6.dpeserver.me/save',
				data: gameData,
				success: function(result){console.log(result); saveLoop = setTimeout(save, 15 * 1000);},
				failure: () => saveLoop = setTimeout(save, 5 * 1000)
		});
}

function logout(hardlogout){
		$.ajax({
				type: 'POST',
				url:  'https://team6.dpeserver.me/save',
				data: gameData,
				success: () => 	$.ajax({
									type: 'POST',
									url:  'https://team6.dpeserver.me/logout',
									data: {hardlogout: hardlogout},
									success: () => window.location = 'https://team6.dpeserver.me/'
								})
		});
}

function incScore(n){
		gameData.score += n;
		gameData.currency += n;
		updateScore();
}

function build(n){
		var curCost = buildingCost(n, gameData[`building${n}`]);
		if (gameData.currency >= curCost){
				gameData.currency -= curCost
				gameData[`building${n}`] += 1;
		}
		updateBuildings(n);
		updateIncome((calcIncome()*60).toFixed(2));
		updateCurrency();
}

function buildingCost(n, amount){
		var buildingBase = [10, 100, 1100, 12000, 130000, 1400000];
		return Math.floor(buildingBase[n - 1] * Math.pow(1.15, amount));
}

function calcIncome(){
		var incomeBase = [0.1, 1, 8, 47, 260, 1400];
		var income = 0;
		for (var i = 1; i <= numBuildings; i++){
				income += (gameData[`building${i}`] * incomeBase[i -1]) / 60;
		}
		console.log(income);
		return income;
}

function updateScore(){
		document.getElementById('score').innerHTML = Math.floor(gameData.score);
		updateCurrency();
}

function updateCurrency(){
		document.getElementById('currency').innerHTML = Math.floor(gameData.currency);
}

function updateIncome(income){
		document.getElementById('income').innerHTML = income;
}

function updateBuildings(n = -1){
		if (n == -1){
					for (var  i = 1; i <= numBuildings; i++){
							document.getElementById(`build${i}`).innerHTML = gameData[`building${i}`];
							document.getElementById(`buildCost${i}`).innerHTML = buildingCost(i, gameData[`building${i}`]);
					}
		} else {
					document.getElementById(`build${n}`).innerHTML = gameData[`building${n}`];
					document.getElementById(`buildCost${n}`).innerHTML = buildingCost(n, gameData[`building${n}`]);
		}
}
