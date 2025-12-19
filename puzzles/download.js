function validate(puzzle, i) {
	var result = {
		id: puzzle.id,
		groups: {},
		images: {},
		startingGroups: [
			['', '', '', ''],
			['', '', '', ''],
			['', '', '', ''],
			['', '', '', '']
		]
	};
	if(!puzzle.categories) {
		console.error('categories field not found on puzzle ' + i);
		process.exit(1);
	}
	if(!Array.isArray(puzzle.categories)) {
		console.error('categories is not an array on puzzle ' + i);
		process.exit(1);
	}
	if(puzzle.categories.length !== 4) {
		console.error('Puzzle ' + i + ' had ' + puzzle.categories.length + ' categories');
		process.exit(1);
	}
	for(var g = 0; g < puzzle.categories.length; ++g) {
		const category = puzzle.categories[g];
		if(typeof category.title !== 'string') {
			console.error('no title for category ' + g + ' of puzzle ' + i);
			process.exit(1);
		}
		if(!category.cards || !Array.isArray(category.cards)) {
			console.error('invalid cards for category ' + g + ' of puzzle ' + i);
			process.exit(1);
		}
		if(category.cards.length !== 4) {
			console.error('cards for category ' + g + ' of puzzle ' + i + ' has length of ' + category.cards.length);
			process.exit(1);
		}
		result.groups[category.title] = { level: g, members: ['', '', '', ''] };
		for(var m = 0; m < category.cards.length; ++m) {
			let content = '';
			const card = category.cards[m];
			// TODO: image_url, image_alt_text
			if(typeof card.image_url === 'string') {
				if(typeof card.image_alt_text !== 'string') {
					console.error('card.image_url ' + m + ' of category ' + g + ' of puzzle ' + i + ' exists but not image_alt_text');
					process.exit(1);
				}
				content = card.image_alt_text;
				result.images[content] = card.image_url;
			} else if(typeof card.content !== 'string') {
				console.error('card.content ' + m + ' of category ' + g + ' of puzzle ' + i + ' is not a string');
				process.exit(1);
			} else {
				content = card.content;
			}
			if(typeof card.position !== 'number' || card.position < 0 || card.position > 15) {
				console.error('card.position ' + m + ' of category ' + g + ' of puzzle ' + i + ' is invalid: ' + card.position);
				process.exit(1);
			}
			result.groups[category.title].members[m] = content;
			result.startingGroups[Math.floor(card.position / 4)][card.position % 4] = content;
		}
	}
	return result;
}

function sleep(ms) {
  return new Promise(resolve => {
    setTimeout(resolve, ms);
  });
}

const fs = require('fs');
const fetch = require('node-fetch');

async function run() {
	let targetDate = new Date(2025, -1+12, 3);
	while(true) {
		const dateStr = `${targetDate.getFullYear()}-${String(targetDate.getMonth() + 1).padStart(2, '0')}-${String(targetDate.getDate()).padStart(2, '0')}`;
		const puzzleData = await fetch(`https://www.nytimes.com/svc/connections/v2/${dateStr}.json`);
		if(puzzleData.status != 200)
			break;
		puzzle = await puzzleData.json();
		puzzle = validate(puzzle, dateStr);
		
		fs.writeFileSync(`${dateStr}.json`, JSON.stringify(puzzle));
		console.log(`Wrote ${dateStr}.json`);
		await sleep(500);

		targetDate.setDate(targetDate.getDate() + 1);
	}
	console.log('Done');
}

run();

