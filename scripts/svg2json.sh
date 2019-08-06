#!/usr/bin/env sh

rm -rf ./dist/json
mkdir -p ./dist/json
if [[ ! -d "./tmp/icons" ]]; then
  git clone https://github.com/Templarian/WindowsIcons.git ./tmp/icons
fi
cd ./tmp/icons
git pull
cd -
find ./tmp/icons/WindowsPhone/svg -name '*.svg' -exec  sh -c 'echo Processing {};node ./scripts/svg2json.js {} > ./dist/json/$(basename {} | tr "." "_" ).json' \;


