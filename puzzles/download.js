function validate(puzzle, i) {
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

function sleep(ms) {
  return new Promise(resolve => {
    setTimeout(resolve, ms);
  });
}

const fs = require('fs');
const fetch = require('node-fetch');

async function run() {
	let targetDate = new Date(2025, 1, 5);
	while(true) {
		const dateStr = `${targetDate.getFullYear()}-${String(targetDate.getMonth() + 1).padStart(2, '0')}-${String(targetDate.getDate()).padStart(2, '0')}`;
		const puzzleData = await fetch(`https://www.nytimes.com/svc/connections/v1/${dateStr}.json`);
		if(puzzleData.status != 200)
			break;
		puzzle = await puzzleData.json();
		validate(puzzle, dateStr);
		
		fs.writeFileSync(`${dateStr}.json`, JSON.stringify(puzzle));
		console.log(`Wrote ${dateStr}.json`);
		await sleep(500);

		targetDate.setDate(targetDate.getDate() + 1);
	}
	console.log('Done');
}

run();

