

const numBuildings = 6;

var gameData = {
		score: null,
		building1: null,
		building2: null,
		building3: null,
		building4: null,
		building5: null,
		building6: null
};

var saveLoop = null;

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
								for (var i = 1; i <= numBuildings; i++){
										gameData[`building${i}`] = parseInt(res[`building${i}`]);
								}
								saveLoop = setTimeout(save, 15 * 1000);
								updateScore();
								updateBuildings();
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

function incScore(){
		gameData.score += 1;
		updateScore();
}

function build(n){
		gameData[`building${n}`] += 1;
		updateBuildings();
}

function updateScore(){
		document.getElementById('score').innerHTML = gameData.score;
}

function updateBuildings(){
		for (var  i = 1; i <= numBuildings; i++){
				document.getElementById(`build${i}`).innerHTML = gameData[`building${i}`]
		}
}
