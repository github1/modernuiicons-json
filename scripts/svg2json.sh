#!/usr/bin/env bash

rm -rf ./dist/json
mkdir -p ./dist/json
rm -rf ./tmp/icons
git clone https://github.com/Templarian/WindowsIcons.git ./tmp/icons
cd ./tmp/icons
git pull
rm -rf ./tmp/icons/.git
cd -

node ./scripts/svg2json.js ./dist/json/ $(find ./tmp/icons/WindowsPhone/svg -name '*.svg' -print0 | tr '\000' ',')


