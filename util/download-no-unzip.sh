#!/bin/bash
wget -O - 'https://www.nytimes.com/games-assets/connections/game-data-by-day.json' | node /home/alipha/repos/connections/util/parse.js > /home/alipha/repos/connections/util/puzzles.js
