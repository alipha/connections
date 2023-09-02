#!/bin/bash
wget -O - 'https://www.nytimes.com/games-assets/connections/game-data-by-day.json' | gunzip -c | node parse.js > puzzles.js
