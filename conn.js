var puzzleNumber;
var todayNumber;
var customId;
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
function getText(td) { return td.firstChild.innerText; }

function setText(td, text) {
	td.firstChild.innerText = text;
	resizeText(td);
}

function resizeText(td) {
	var size = 15;
	td.style.fontSize = '15px';
	while(td.offsetWidth <= td.firstChild.offsetWidth && size > 8) {
		td.style.fontSize = (--size) + 'px';
	}
}

function init() {
	const currentDate = new Date();
	var targetDate = new Date('2023-06-11 00:00:00');
	const timeDifference = currentDate - targetDate;
	const daysDifference = timeDifference / (1000 * 60 * 60 * 24);
	todayNumber = Math.floor(daysDifference);

	const urlParams = new URLSearchParams(window.location.search);
	customId = urlParams.get('custom');

	if(customId === null) {
		const puzzleId = urlParams.get('id');

		puzzleNumber = puzzleId === null ? todayNumber : Number(puzzleId);
		targetDate.setDate(targetDate.getDate() + puzzleNumber);

		if(puzzleNumber === 1) {
			elem('previous').classList.add('hide');
		}
		if(puzzleNumber === todayNumber) {
			elem('next').classList.add('hide');
		}
		elem('previous').href = '?id=' + (puzzleNumber - 1);
		elem('next').href = puzzleNumber === todayNumber - 1 ? '?' : '?id=' + (puzzleNumber + 1);

		const dateOptions = {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		};
		elem('date').innerText = new Intl.DateTimeFormat('en-US', dateOptions).format(targetDate);

		puzzle = puzzles[puzzleNumber - 1];
	} else {
		customId = Number(customId);
		puzzleNumber = 'custom_' + customId;
		if(customId === 1) {
			elem('previous').classList.add('hide');
		}
		if(customId === customPuzzles.length) {
			elem('next').classList.add('hide');
		}
		elem('previous').href = '?custom=' + (customId - 1);
		elem('next').href = '?custom=' + (customId + 1);
		elem('date').innerText = 'Custom #' + customId;

		puzzle = customPuzzles[customId - 1];
	}

	groups = Object.entries(puzzle.groups).map((entry) => ({ solved: false, category: entry[0], ...entry[1] }));
	groups.sort((a, b) => a.level - b.level);

	const start = puzzle.startingGroups;
	for(var r = 0; r < start.length; ++r) {
		const row = start[r];
		
		for(var c = 0; c < row.length; ++c) {
			setText(cellElem(r, c), row[c]);
		}
	}

	const puzzleStorageId = customId === null ? puzzleNumber - 1 : 'custom_' + (customId - 1);
	var storedState = localStorage.getItem('puzzle_' + puzzleStorageId);
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
		const puzzleId = customId === null ? puzzleNumber - 1 : 'custom_' + (customId - 1);
		localStorage.setItem("puzzle_" + puzzleId, JSON.stringify(state));
	}
}

function findWord(word) {
	var cells = document.querySelectorAll(':not(.hide).unsolved td');
	for(var i = 0; i < cells.length; ++i) {
		if(getText(cells[i]) === word) {
			return cells[i];
		}
	}
	throw new Error('Cannot find word ' + word);
}

function wordClick(wordElem) {
	if(wordElem.classList.contains('selected')) {
		wordElem.classList.remove('selected');
		selectedWords = selectedWords.filter(word => word !== getText(wordElem));
	} else if(selectedWords.length < 4) {
		wordElem.classList.add('selected');
		selectedWords.push(getText(wordElem));
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
		words.push({ selected: c.classList.contains('selected'), word: getText(c) });
	});

	shuffleArray(words);

	var i = 0;
	cells.forEach(c => {
		words[i].selected ? c.classList.add('selected') : c.classList.remove('selected');
		setText(c, words[i].word);
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
				resElem(row, col).firstChild.innerText = word;
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
	cellsToMove.forEach(e => { wordsToMove.push(getText(e)); });

	var selectedCellsInRow = document.querySelectorAll('#row_' + solvedCount + ' .selected');
	selectedCellsInRow.forEach(cell => cell.classList.remove('selected'));

	var selectedCells = document.getElementsByClassName('selected');
	while(selectedCells.length > 0) {
		setText(selectedCells[0], wordsToMove.shift());
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

	var resultElems = document.querySelectorAll('#results td');
	resultElems.forEach(e => resizeText(e));
}

function share() {
	var text = customId === null ?
		'Connections\nPuzzle #' + puzzleNumber + '\n' + toEmojis() :
		'Connections\nCustom Puzzle #' + customId + '\n' + toEmojis();
	
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
