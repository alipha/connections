var fs = require('fs');
var file = fs.readFileSync(0, 'utf-8');
var matched = file.match(/\[\{groups:.*?\]\]\}\]/);
if(matched && matched.length === 1) {
	var puzzleStr = matched[0];
	var puzzles = eval(puzzleStr);
	if(!puzzles || !Array.isArray(puzzles)) {
		console.error('Unable to parse json');
		process.exit(1);
	}

	for(var i = 0; i < puzzles.length; ++i) {
		var puzzle = puzzles[i];
		if(!puzzle.groups) {
			console.error('groups field not found on puzzle ' + i);
			process.exit(1);
		}
		if(!puzzle.startingGroups || !Array.isArray(puzzle.startingGroups) || puzzle.startingGroups.length !== 4) {
			console.error('startingGroups is not valid on puzzle ' + i);
			process.exit(1);
		}
		var groupCount = 0;
		for(const [category, group] of Object.entries(puzzle.groups)) {
			groupCount++;
			if(typeof group.level !== 'number' || group.level < 0 || group.level > 3) {
				console.error('invalid level ' + group.level + ' for puzzle ' + i);
				process.exit(1);
			}
			if(!group.members || !Array.isArray(group.members) || group.members.length !== 4) {
				console.error('invalid members for puzzle ' + i);
				process.exit(1);
			}
			for(var m = 0; m < group.members.length; ++m) {
				if(typeof group.members[m] !== 'string') {
					console.error('group.member ' + m + ' of puzzle ' + i + ' is not a string');
					process.exit(1);
				}
			}
		}
		if(groupCount !== 4) {
			console.error('Puzzle ' + i + ' had ' + groupCount + ' groups');
			process.exit(1);
		}
		for(var g = 0; g < puzzle.startingGroups.length; ++g) {
			var group = puzzle.startingGroups[g];
			if(!group || !Array.isArray(group) || group.length !== 4) {
				console.error('Group ' + g + ' on puzzle ' + i + ' is not valid');
				process.exit(1);
			}
			for(var m = 0; m < group.length; ++m) {
				if(typeof group[m] !== 'string') {
					console.error('group[' + g + '][' + m + '] of puzzle ' + i + ' is not a string');
					process.exit(1);
				}
			}
		}
	}
	console.log('var puzzles = ' + puzzleStr + ';');
	console.error('puzzles.length = ' + puzzles.length);
} else {
	console.error('Puzzle array not found');
}
