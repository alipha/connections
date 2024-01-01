var puzzleNumber;
var todayNumber;
var customId = null;
var changedId = null;
var adhocId = null;
var puzzle;
var groups;
var guesses = [];
var solvedCount = 0;
var mistakesLeft = 4;
var solved = [false, false, false, false];
var loadedState = false;
var marker = 'selected';
var markerWords = { selected: [], red: [], blue: [], yellow: [], red_border: [], blue_border: [], yellow_border: [] };
var state;
var doubleTap = false;
var timeoutFade;
var timeoutClear;

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

function puzzleId() {
	return adhocId !== null ? puzzleNumber 
	   : changedId !== null ? 'changed_' + (changedId - 1)
		: customId !== null ? 'custom_' + (customId - 1) 
		: puzzleNumber - 1;
}

async function init() {
	const currentDate = new Date();
	currentDate.setHours(0, 0, 0, 0);
	var targetDate = new Date('2023-06-11 00:00:00');
	const timeDifference = currentDate - targetDate;
	const daysDifference = timeDifference / (1000 * 60 * 60 * 24);
	todayNumber = Math.round(daysDifference);

	const urlParams = new URLSearchParams(window.location.search);
	customId = urlParams.get('custom');
	changedId = urlParams.get('changed');
	const adhocStr = urlParams.get('adhoc');

	if(adhocStr !== null) {
		var adhoc = atob(adhocStr.replace(/_/g, '/').replace(/-/g, '+').replace(/~/g, '='));
		puzzle = JSON.parse(adhoc);
	   adhocId = await getAdhocId(adhoc);
		puzzleNumber = 'adhoc_' + adhocId;
		elem('previous').classList.add('hide');
		elem('next').classList.add('hide');
		elem('date').innerText = 'Puzzle ' + adhocId;
	} else if(customId !== null) {
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
	} else if(changedId !== null) {
		changedId = Number(changedId);
		puzzleNumber = 'changed_' + changedId;
		puzzle = changedPuzzles[changedId - 1];

		if(changedId === 1) {
			elem('previous').classList.add('hide');
		}
		if(changedId === changedPuzzles.length) {
			elem('next').classList.add('hide');
		}
		elem('previous').href = '?changed=' + (changedId - 1);
		elem('next').href = '?changed=' + (changedId + 1);
		
		var date = targetDate;
		date.setDate(targetDate.getDate() + puzzle.id + 1);

    	var formattedDate = date.getDate();
    	var formattedMonth = date.getMonth() + 1;
   	var formattedYear = date.getFullYear().toString().substr(2,2);

	   var dateString =  ' (' + formattedMonth + '/' + formattedDate + '/' + formattedYear + ')';

		elem('date').innerText = 'Official #' + (puzzle.id + 1) + dateString;
	} else {
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

		if(puzzleNumber < 205) {
			puzzle = puzzles[puzzleNumber - 1];
		} else {
			const dateStr = `${targetDate.getFullYear()}-${String(targetDate.getMonth() + 1).padStart(2, '0')}-${String(targetDate.getDate()).padStart(2, '0')}`;
			const puzzleData = await fetch(`puzzles/${dateStr}.json`);
			puzzle = await puzzleData.json();
		}
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

	const puzzleStorageId = puzzleId();
	var storedState = localStorage.getItem('puzzle_' + puzzleStorageId);
	if(storedState) {
		state = JSON.parse(storedState);
		for(var i = 0; i < state.guesses.length; ++i) {
			var guess = state.guesses[i];
			for(var w = 0; w < guess.length; ++w) {
				wordClick(findWord(guess[w]));
			}
			submit();
			deselect(undefined, true);
		}
		if(state.selectedWords === undefined)
			state.selectedWords = state.selected;
		if(state.selectedWords === undefined)
			state.selectedWords = [];
		for(var i = 0; i < state.selectedWords.length; ++i) {
			wordClick(findWord(state.selectedWords[i]));
		}
		for(var c = 0; c < 6; ++c) {
			marker = ['red', 'blue', 'yellow', 'red_border', 'blue_border', 'yellow_border'][c];
			for(var i = 0; state[marker] && i < state[marker].length; ++i) {
				wordClick(findWord(state[marker][i]));
			}
		}
		marker = 'selected';
	}

	loadedState = true;
}

function saveState() {
	if(loadedState) {
		state = { 
			guesses, 
			solved, 
			selectedWords: markerWords.selected, 
			red: markerWords.red,
			blue: markerWords.blue,
			yellow: markerWords.yellow,
			red_border: markerWords.red_border,
			blue_border: markerWords.blue_border,
			yellow_border: markerWords.yellow_border
		};
	
		localStorage.setItem("puzzle_" + puzzleId(), JSON.stringify(state));
	}
}

function tryFindWord(word) {
	var cells = document.querySelectorAll(':not(.hide).unsolved td');
	for(var i = 0; i < cells.length; ++i) {
		if(getText(cells[i]) === word) {
			return cells[i];
		}
	}
	return undefined;
}

function findWord(word) {
	var cell = tryFindWord(word);
	if(!cell)
		throw new Error('Cannot find word ' + word);
	return cell;
}

function wordClick(wordElem) {
	if(wordElem.classList.contains(marker)) {
		wordElem.classList.remove(marker);
		markerWords[marker] = markerWords[marker].filter(word => word !== getText(wordElem));
	} else if(marker !== 'selected' || markerWords.selected.length < 4) {
		wordElem.classList.add(marker);
		markerWords[marker].push(getText(wordElem));
	}

	saveState();

	if(markerWords.selected.length === 4) {
		elem('submit').classList.add('enabled');
	} else {
		elem('submit').classList.remove('enabled');
	}
}

function setMarker(m) {
	if(marker === m)
		return;

	if(marker === 'selected') {
		var selectedCells = document.getElementsByClassName('selected');
		while(selectedCells.length > 0) {
			selectedCells[0].classList.add(m);
			selectedCells[0].classList.remove('selected');
		}
		for(var i = 0; i < markerWords.selected.length; ++i) {
			var word = markerWords.selected[i];
			if(markerWords[m].indexOf(word) === -1)
				markerWords[m].push(word);
		}
		markerWords.selected = [];
		elem('submit').classList.remove('enabled');
		saveState();
	}

	elem('marker_' + marker).classList.remove('picked');
	elem('marker_' + m).classList.add('picked');
	marker = m;
}

function shuffle() {
	var words = [];
	var cells = document.querySelectorAll(':not(.hide).unsolved td');
	cells.forEach(c => {
		words.push({ classes: c.className, word: getText(c) });
	});

	shuffleArray(words);

	var i = 0;
	cells.forEach(c => {
		c.className = words[i].classes;
		setText(c, words[i].word);
		++i;
	});
}

function deselect(m, ignoreDoubleTap) {
	m = m ?? marker;
	markerWords[m] = [];
	saveState();
	const elements = document.getElementsByClassName(m);
	if(!ignoreDoubleTap && elements.length === 0) {
		if(doubleTap) {
			deselect('selected', true);
			deselect('red', true);
			deselect('blue', true);
			deselect('yellow', true);
			deselect('red_border', true);
			deselect('blue_border', true);
			deselect('yellow_border', true);
			clearPreviousGuess();
			doubleTap = false;
		} else {
			showTip('Tap again to clear all');
			doubleTap = true;
			setTimeout(() => doubleTap = false, 2000);
		}
	}
	while(elements.length > 0) {
		elements[0].classList.remove(m);
	}
	if(m === 'selected')
		elem('submit').classList.remove('enabled');
}

function clearPreviousGuess() {
	var guessCells = document.getElementsByClassName('previous-guess');
	while(guessCells.length > 0)
		guessCells[0].classList.remove('previous-guess');
}

function previousGuess(guessIndex) {
	if(elem('guess_outcome_' + guessIndex).innerText === 'Correct')
		return;
	var guessCell = elem('guess_words_' + guessIndex);
	if(guessCell.classList.contains('previous-guess')) {
		clearPreviousGuess();
	} else {
		clearPreviousGuess();
		guessCell.classList.add('previous-guess');
		var words = guesses[6 - guessIndex];
		for(var i = 0; i < words.length; ++i) {
			var cell = tryFindWord(words[i]);
			if(cell)
				cell.classList.add('previous-guess');
		}
	}
}

function showTip(tip) {
	if(!loadedState) 
		return;
	elem('toast-contents').innerText = tip;
	elem('toast').classList.remove('fade');
	elem('toast').classList.add('visible');
	clearTimeout(timeoutFade);
	clearTimeout(timeoutClear);
	timeoutFade =  setTimeout(() => elem('toast').classList.add('fade'), 2000);
	timeoutClear = setTimeout(() => elem('toast-contents').innerText = '', 2500);
}

function submit() {
	if(markerWords.selected.length !== 4)
		return;
	
	if(alreadyGuessed()) {
		showTip("Already guessed!");
		return;
	}

	addToResults();

	for(var i = 0; i < groups.length; ++i) {
		var count = matchCount(groups[i].members, markerWords.selected);
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

	for(var col = 0; col < markerWords.selected.length; ++col) {
		var word = markerWords.selected[col];

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
		if(matchCount(guesses[i], markerWords.selected) === 4)
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
	cellsToMove.forEach(e => { 
		wordsToMove.push({ classes: e.className, word: getText(e) });
		e.className = '';
	});

	var selectedCellsInRow = document.querySelectorAll('#row_' + solvedCount + ' .selected');
	selectedCellsInRow.forEach(cell => {
		cell.className = '';
		removeFromLists(cell);
	});

	var selectedCells = document.getElementsByClassName('selected');
	while(selectedCells.length > 0) {
		removeFromLists(selectedCells[0]);
		var word = wordsToMove.shift();
		setText(selectedCells[0], word.word);
		selectedCells[0].className = word.classes;
	}

	elem('row_' + solvedCount).classList.add('hide');
	document.querySelector('.solved-counter .level-' + group.level).innerHTML = '&check;';

	solved[group.level] = true;
	addToGuesses((td) => {
		td.classList.add('level-' + group.level);
		td.innerText = 'Correct';
	});

	++solvedCount;
	deselect('selected', true);
	if(solvedCount === 4)
		gameOver();
}

function removeFromLists(cell) {
	for(var i = 0; i < 6; ++i) {
		var c = ['red', 'blue', 'yellow', 'red_border', 'blue_border', 'yellow_border'][i];
		markerWords[c] = markerWords[c].filter(w => w !== getText(cell));
	}
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
	elem('guess_words_' + row).innerText = markerWords.selected.join(', ');
	fn(elem('guess_outcome_' + row));
	guesses.push([...markerWords.selected]);
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
	var text = adhocId !== null ? 'Connections\nPuzzle ' + adhocId + '\n' + toEmojis() 
		: customId !== null ? 'Connections\nCustom Puzzle #' + customId + '\n' + toEmojis()
		: changedId !== null ? 'Connections\nOfficial Puzzle #' + (puzzle.id + 1) + '\n' + toEmojis()
		: 'Connections\nPuzzle #' + puzzleNumber + '\n' + toEmojis();
	
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

async function getResultsFromString(base64) {
	var byteStr;
	try {
		byteStr = atob(base64.replace(/_/g, '/').replace(/-/g, '+') + '='); 
	} catch(e) {
		return undefined;
	}
	if(byteStr.length !== 14)
		return undefined;

   var bytes = [];
   for(var i = 0; i < byteStr.length; ++i) {
      bytes.push(byteStr.charCodeAt(i)); 
   }
   bytes = await xorPuzzleNum(bytes);

	var results = [];
	for(var i = 0; i < 7; ++i) {
		var guess = [];
		guess.push(indexToStartingWord(bytes[i*2] & 15));
		guess.push(indexToStartingWord(bytes[i*2] >> 4));
		guess.push(indexToStartingWord(bytes[i*2+1] & 15));
		guess.push(indexToStartingWord(bytes[i*2+1] >> 4));
		results.push(guess);
	}
	return results;
}

async function getResultString() {
	var bytes = Array(14).fill(0);
	for(var i = 0; i < guesses.length; ++i) {
		var guess = guesses[i];
		bytes[i*2] = indexInStartingGroup(guess[0]) + 
			(indexInStartingGroup(guess[1]) << 4);
		bytes[i*2+1] = indexInStartingGroup(guess[2]) +
			(indexInStartingGroup(guess[3]) << 4);
	}

	bytes = await xorPuzzleNum(bytes);
	var byteStr = String.fromCharCode(...bytes);
   return btoa(byteStr).replace(/\//g, '_').replace(/\+/g, '-').slice(0, -1);
}

async function xorPuzzleNum(bytes) {
	 var answer = puzzleNumber.toString();
    bytes = await xorHalf(answer, bytes, true);
    bytes = await xorHalf(answer, bytes, false);
    return xorHalf(answer, bytes, true);
}

async function xorHalf(answer, bytes, xorFirstHalf) {
    var keyBytes = [];

    var keyStart = 0;
    var keyEnd = Math.floor(bytes.length / 2);
    var xorStart = Math.floor(bytes.length / 2);
    var xorEnd = bytes.length;
    if(xorFirstHalf) {
        keyStart = xorStart;
        keyEnd = xorEnd;
        xorStart = 0;
        xorEnd = Math.floor(bytes.length / 2);
    }

    for(var i = keyStart; i < keyEnd; ++i) {
        keyBytes.push(bytes[i]);
    }
    for(var i = 0; i < answer.length; ++i) {
        keyBytes.push(answer.charCodeAt(i));
    }

    var buffer = await window.crypto.subtle.digest("SHA-256", new Uint8Array(keyBytes).buffer);
    var hashBytes = Array.from(new Uint8Array(buffer));
    for(var i = xorStart; i < xorEnd; ++i) {
        bytes[i] ^= hashBytes[i];
    }
    bytes[bytes.length - 1] &= 0xfc;
    return bytes;
}

async function getAdhocId(message) {
  const msgUint8 = new TextEncoder().encode(message); // encode as (utf-8) Uint8Array
  const hashBuffer = await crypto.subtle.digest("SHA-256", msgUint8); // hash the message
  const hashArray = Array.from(new Uint8Array(hashBuffer)); // convert buffer to byte array
  const hashHex = hashArray
    .map((b) => b.toString(16).padStart(2, "0"))
    .join(""); // convert bytes to hex string
  return hashHex.substring(0, 16);
}

function indexInStartingGroups(word) {
	for(var g = 0; g < puzzle.startingGroups.length; ++g) {
		var i = puzzle.startingGroups[g].indexOf(word);
		if(i >= 0)
			return g * puzzle.startingGroups.length + i;
	}
	throw new Error('word ' + word + ' not found in startingGroups');
}

function indexToStartingWord(index) {
	return puzzle.startingGroups[index >> 2][index & 3];
}
