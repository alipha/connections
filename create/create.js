function elem(id) { return document.getElementById(id); }

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

function wordElem(row, col) { return elem('word_' + row + '_' + col); }

function cellElem(row, col) { return elem('cell_' + row + '_' + col); }

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

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}


function init() {}

function generate() {
	for(var r = 0; r < 4; ++r) {
		if(elem('category_' + r).value.trim() === '') return;
		for(var c = 0; c < 4; ++c) {
			if(wordElem(r, c).value.trim() === '') return;
		}
	}
	
	for(var r = 0; r < 4; ++r) {
		for(var c = 0; c < 4; ++c) {
			var cell = cellElem(r, c);
			setText(cell, wordElem(r, c).value.toUpperCase().trim());
		}
	}

	shuffle();

	var puzzle = { groups: {}, startingGroups: [] };

	for(var r = 0; r < 4; ++r) {
		var groupRow = [];
		var startingRow = [];
		for(var c = 0; c < 4; ++c) {
			groupRow.push(wordElem(r, c).value.toUpperCase().trim());
			startingRow.push(getText(cellElem(r, c)));
		}
		var category = elem('category_' + r).value.toUpperCase().trim();
		puzzle.groups[category] = {
			level: r,
			members: groupRow
		};
		puzzle.startingGroups.push(startingRow);
	}
   
	var puzzleJson = JSON.stringify(puzzle);
	var base64 = btoa(puzzleJson).replace(/\//g, '_').replace(/\+/g, '-').replace(/=/g, '~');

	elem('link').href = '../?adhoc=' + base64;
	elem('link').classList.remove('hidden');
}
