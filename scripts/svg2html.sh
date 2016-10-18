#!/usr/bin/env sh

if [ ! -d "./tmp/icons" ]; then
  git clone https://github.com/Templarian/WindowsIcons.git ./tmp/icons
fi
cd ./tmp/icons
git pull
cd -
mkdir -p ./dist
output='<table>'
for file in $(find ./tmp/icons/WindowsPhone/svg -name '*.svg' -print0|xargs -0 -n 1 echo); do
  output+="<tr><td>$(basename $file)</td><td>$(cat $file)</td></tr>"
done
output+='</table>'
echo $output > ./dist/index.html

