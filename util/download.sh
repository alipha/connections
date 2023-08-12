#!/bin/bash
wget -O - $1 | gunzip -c | node parse.js > puzzles.js
