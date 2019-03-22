
var gameData = {
		score: null
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
				success: function(result){
						if (result == 'init'){
								init();
						} else {
								console.log(result);
								gameData.score = parseInt(result.score);
								saveLoop = setTimeout(save, 15 * 1000);
								updateScore();
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
		save();
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

function updateScore(){
		document.getElementById('score').innerHTML = gameData.score;
}
