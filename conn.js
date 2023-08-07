var puzzleNumber;
var puzzle;
var groups;
var selectedWords = [];
var guesses = [];
var solvedCount = 0;
var mistakesLeft = 4;
var solved = [false, false, false, false];
var state = { guesses, solved, selectedWords };
var loadedState = false;

function elem(id) { return document.getElementById(id); }
function cellElem(row, col) { return elem('cell_' + row + '_' + col); }
function resElem(row, col) { return elem('result_' + row + '_' + col); }

function init() {
	const currentDate = new Date();
	const targetDate = new Date('2023-06-12 00:00:00');
	const timeDifference = currentDate - targetDate;
	const daysDifference = timeDifference / (1000 * 60 * 60 * 24);
	puzzleNumber = Math.floor(daysDifference);
	puzzle = puzzles[puzzleNumber];
	groups = Object.entries(puzzle.groups).map((entry) => ({ solved: false, category: entry[0], ...entry[1] }));
	groups.sort((a, b) => a.level - b.level);

	const start = puzzle.startingGroups;
	for(var r = 0; r < start.length; ++r) {
		const row = start[r];
		
		for(var c = 0; c < row.length; ++c) {
			cellElem(r, c).innerText = row[c];
		}
	}

	var storedState = localStorage.getItem('puzzle_' + puzzleNumber);
	if(storedState) {
		state = JSON.parse(storedState);
		for(var i = 0; i < state.guesses.length; ++i) {
			var guess = state.guesses[i];
			for(var w = 0; w < guess.length; ++w) {
				wordClick(findWord(guess[w]));
			}
			submit();
			deselect();
		}
		for(var i = 0; i < state.selected.length; ++i) {
			wordClick(findWord(state.selected[i]));
		}
	}

	loadedState = true;
}

function saveState() {
	if(loadedState) {
		state = { guesses, solved, selected: selectedWords };
		localStorage.setItem("puzzle_" + puzzleNumber, JSON.stringify(state));
	}
}

function findWord(word) {
	var cells = document.querySelectorAll(':not(.hide).unsolved td');
	for(var i = 0; i < cells.length; ++i) {
		if(cells[i].innerText === word) {
			return cells[i];
		}
	}
	throw new Error('Cannot find word ' + word);
}

function wordClick(wordElem) {
	if(wordElem.classList.contains('selected')) {
		wordElem.classList.remove('selected');
		selectedWords = selectedWords.filter(word => word !== wordElem.innerText);
	} else if(selectedWords.length < 4) {
		wordElem.classList.add('selected');
		selectedWords.push(wordElem.innerText);
	}

	saveState();

	if(selectedWords.length === 4) {
		elem('submit').classList.add('enabled');
	} else {
		elem('submit').classList.remove('enabled');
	}
}

function shuffle() {
	var words = [];
	var cells = document.querySelectorAll(':not(.hide).unsolved td');
	cells.forEach(c => {
		words.push({ selected: c.classList.contains('selected'), word: c.innerText });
	});

	shuffleArray(words);

	var i = 0;
	cells.forEach(c => {
		words[i].selected ? c.classList.add('selected') : c.classList.remove('selected');
		c.innerText = words[i].word;
		++i;
	});
}

function deselect() {
	selectedWords = [];
	saveState();
	const elements = document.getElementsByClassName('selected');
	while(elements.length > 0) {
		elements[0].classList.remove('selected');
	}
	elem('submit').classList.remove('enabled');
}

function showTip(tip) {
	if(!loadedState) 
		return;
	elem('toast-contents').innerText = tip;
	elem('toast').classList.remove('fade');
	elem('toast').classList.add('visible');
	setTimeout(() => elem('toast').classList.add('fade'), 2000);
}

function submit() {
	if(selectedWords.length !== 4)
		return;
	
	if(alreadyGuessed()) {
		showTip("Already guessed!");
		return;
	}

	addToResults();

	for(var i = 0; i < groups.length; ++i) {
		var count = matchCount(groups[i].members, selectedWords);
		if(count === 4) {
			processMatch(groups[i]);
			return;
		} else if(count === 3) {
			processOneAway();
			return;
		}
	}

	processMiss();
}

function addToResults() {
	var row = guesses.length;

	for(var col = 0; col < selectedWords.length; ++col) {
		var word = selectedWords[col];

		for(var i = 0; i < groups.length; ++i) {
			var group = groups[i];
			if(group.members.includes(word)) {
				resElem(row, col).innerText = word;
				resElem(row, col).classList.add('level-' + group.level);
				break;
			}
		}
	}

	elem('result_row_' + row).classList.add('show-row');
}

function alreadyGuessed() {
	for(var i = 0; i < guesses.length; ++i)
		if(matchCount(guesses[i], selectedWords) === 4)
			return true;
	return false;
}

function matchCount(group1, group2) {
	return group1.filter(word => group2.includes(word)).length;
}

function showSolvedRow(row, group) {
	elem('solved_cell_' + row).classList.add('level-' + group.level);
	elem('category_' + row).innerText = group.category;
	elem('words_' + row).innerText = group.members.join(', ');
	elem('solved_row_' + row).classList.add('show-row');
}

function processMatch(group) {
	group.solved = true;
	showSolvedRow(solvedCount, group);

	var cellsToMove = document.querySelectorAll('#row_' + solvedCount + ' td:not(.selected)');
	var wordsToMove = [];
	cellsToMove.forEach(e => { wordsToMove.push(e.innerText); });

	var selectedCellsInRow = document.querySelectorAll('#row_' + solvedCount + ' .selected');
	selectedCellsInRow.forEach(cell => cell.classList.remove('selected'));

	var selectedCells = document.getElementsByClassName('selected');
	while(selectedCells.length > 0) {
		selectedCells[0].innerText = wordsToMove.shift();
		selectedCells[0].classList.remove('selected');
	}

	elem('row_' + solvedCount).classList.add('hide');
	document.querySelector('.solved-counter .level-' + group.level).innerHTML = '&check;';

	solved[group.level] = true;
	addToGuesses((td) => {
		td.classList.add('level-' + group.level);
		td.innerText = 'Correct';
	});

	++solvedCount;
	deselect();
	if(solvedCount === 4)
		gameOver();
}

function processOneAway() {
	showTip('One away');
	addToGuesses((td) => { td.innerText = 'One away'; });
	markMistake();
}

function processMiss() {
	showTip('Incorrect');
	addToGuesses((td) => { td.innerText = 'Incorrect'; });
	markMistake();
}

function addToGuesses(fn) {
	var row = 6 - guesses.length;
	elem('no_guesses').classList.add('hide');
	elem('guess_words_' + row).innerText = selectedWords.join(', ');
	fn(elem('guess_outcome_' + row));
	guesses.push([...selectedWords]);
	elem('guess_' + row).classList.add('show-row');
	saveState();
}

function markMistake() {
	--mistakesLeft;
	elem('mistakes_left_' + mistakesLeft).classList.add('destroyed');
	(function(mistakeNum) {
		setTimeout(() => elem('mistakes_left_' + mistakeNum).classList.add('hidden'), 1000);
	})(mistakesLeft);

	if(mistakesLeft === 0) {
		showTip('You lost');

		var timeout = loadedState ? 2000 : 0;
		setTimeout(() => {
			var unsolved = document.querySelectorAll('.unsolved');
			unsolved.forEach(row => row.classList.add('hide'));

			var row = solvedCount;
			for(var i = 0; i < groups.length; ++i) {
				if(!groups[i].solved) {
					showSolvedRow(row, groups[i]);
					++row;
				}
			}
		}, timeout);

		gameOver();
	}
}

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

function gameOver() {
	elem('mistakes').classList.add('hide');
	elem('buttons').classList.add('hide');
	elem('guesses_section').classList.add('hide');
	elem('results_section').classList.add('show-block');
	elem('puzzle').classList.add('all-solved');
}

function share() {
	var text = 'Connections\nPuzzle #' + (puzzleNumber + 1) + '\n' + toEmojis();
	
	navigator.clipboard.writeText(text)
		.then(() => showTip('Results copied to clipboard'))
		.catch((e) => showTip('Error copying to clipboard'));
}

function toEmojis() {
	var text = '';
	for(var r = 0; r < 7; ++r) {
		for(var c = 0; c < 4; ++c) {
			var emoji = getEmoji(resElem(r, c));
			if(emoji === undefined)
				return text;
			text += emoji;
		}
		text += '\n';
	}
	return text;
}

function getEmoji(elem) {
	if(elem.classList.contains('level-0')) {
		return String.fromCodePoint(129000);
	} else if(elem.classList.contains('level-1')) {
		return String.fromCodePoint(129001);
	} else if(elem.classList.contains('level-2')) {
		return String.fromCodePoint(128998);
	} else if(elem.classList.contains('level-3')) {
		return String.fromCodePoint(129002);
	} else {
		return undefined;
	}
}
