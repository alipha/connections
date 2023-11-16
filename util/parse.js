const isDeepEqual = (object1, object2) => {

  const objKeys1 = Object.keys(object1);
  const objKeys2 = Object.keys(object2);

  if (objKeys1.length !== objKeys2.length) return false;

  for (var key of objKeys1) {
    const value1 = object1[key];
    const value2 = object2[key];

    const isObjects = isObject(value1) && isObject(value2);

    if ((isObjects && !isDeepEqual(value1, value2)) ||
      (!isObjects && value1 !== value2)
    ) {
      return false;
    }
  }
  return true;
};

const isObject = (object) => {
  return object != null && typeof object === "object";
};

function validate(which, puzzles) {
	if(!puzzles || !Array.isArray(puzzles)) {
		console.error(which + ': Unable to parse json');
		process.exit(1);
	}

	for(var i = 0; i < puzzles.length; ++i) {
		var puzzle = puzzles[i];
		if(!puzzle.groups) {
			console.error(which + ': groups field not found on puzzle ' + i);
			process.exit(1);
		}
		if(!puzzle.startingGroups || !Array.isArray(puzzle.startingGroups) || puzzle.startingGroups.length !== 4) {
			console.error(which + ': startingGroups is not valid on puzzle ' + i);
			process.exit(1);
		}
		var groupCount = 0;
		for(const [category, group] of Object.entries(puzzle.groups)) {
			groupCount++;
			if(typeof group.level !== 'number' || group.level < 0 || group.level > 3) {
				console.error(which + ': invalid level ' + group.level + ' for puzzle ' + i);
				process.exit(1);
			}
			if(!group.members || !Array.isArray(group.members) || group.members.length !== 4) {
				console.error(which + ': invalid members for puzzle ' + i);
				process.exit(1);
			}
			for(var m = 0; m < group.members.length; ++m) {
				if(typeof group.members[m] !== 'string') {
					console.error(which + ': group.member ' + m + ' of puzzle ' + i + ' is not a string');
					process.exit(1);
				}
			}
		}
		if(groupCount !== 4) {
			console.error(which + ': Puzzle ' + i + ' had ' + groupCount + ' groups');
			process.exit(1);
		}
		for(var g = 0; g < puzzle.startingGroups.length; ++g) {
			var group = puzzle.startingGroups[g];
			if(!group || !Array.isArray(group) || group.length !== 4) {
				console.error(which + ': Group ' + g + ' on puzzle ' + i + ' is not valid');
				process.exit(1);
			}
			for(var m = 0; m < group.length; ++m) {
				if(typeof group[m] !== 'string') {
					console.error(which + ': group[' + g + '][' + m + '] of puzzle ' + i + ' is not a string');
					process.exit(1);
				}
			}
		}
	}
}

var fs = require('fs');
var currentFile = fs.readFileSync('/home/alipha/repos/connections/puzzles.js', 'utf-8');
var current = eval(currentFile.substring(14, currentFile.length-2));
validate('current', current);
console.error('current.length = ' + current.length);

var file = fs.readFileSync(0, 'utf-8');
var puzzles = JSON.parse(file);
validate('new', puzzles);
console.error('puzzles.length = ' + puzzles.length);

if(current.length > puzzles.length) {
	console.error('fewer puzzles!');
	process.exit(1);
}

for(var i = current.length; i < puzzles.length; ++i) {
	current.push(puzzles[i]);
}

console.error('New current.length = ' + current.length);
console.log('var puzzles = ' + JSON.stringify(current) + ';');

var changedPuzzles = [];
var changedIds = []

for(var i = 0; i < current.length; ++i) {
	if(current[i].id === undefined)
		current[i].id = i;
	if(puzzles[i].id === undefined)
		puzzles[i].id = i;

	if(!isDeepEqual(current[i], puzzles[i])) {
		changedPuzzles.push(puzzles[i]);
		changedIds.push(i);
	}
}

console.error('Changed puzzles: ' + changedIds);
fs.writeFileSync('/home/alipha/repos/connections/changed.js', 'var changedPuzzles = ' + JSON.stringify(changedPuzzles) + ';');
