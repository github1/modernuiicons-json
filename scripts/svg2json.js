'use strict';

const fs = require('fs');
const path = require('path');
const htmlparser = require('htmlparser2');
const outputDir = process.argv[2];
const svgFiles = process.argv[3].split(/,/);

const camelCase = (prop) => {
  return prop.replace(/[-|:]([a-z])/gi, (val, match) => match.toUpperCase());
};

const processNode = (node, container, iconId) => {
  if (Array.isArray(node)) {
    node.forEach((n) => processNode(n, container, iconId));
  } else {
    const attrs = {},
      children = [];
    attrs['data-icon'] = iconId;
    if (node.type === 'tag') {
      if (node.name === 'svg')
        container.root = [node.name, attrs, children];
      if (typeof container.root === 'undefined')
        return;
      if (node.attribs) {
        Object.keys(node.attribs).reduce((acc, cur) => {
          acc[camelCase(cur)] = node.attribs[cur];
          return acc;
        }, attrs);
      }
      if (node.children) {
        node.children.forEach((n) => processNode(n, Object.assign((child) => {
          children.push(child);
        }, {
          root: container.root
        })), iconId);
      }
      let adjustingViewBox = container.root[1].viewBoxTemp || {
        x1: 999,
        y1: 999,
        x2: 0,
        y2: 0
      };
      if (attrs.d) {
        attrs.d.split(/[\s]+/).forEach((part) => {
          let pair = part.split(/,/).map((value) => parseFloat(value));
          if (pair.length === 2) {
            adjustingViewBox.x1 = Math.min(pair[0], adjustingViewBox.x1);
            adjustingViewBox.y1 = Math.min(pair[1], adjustingViewBox.y1);
            adjustingViewBox.x2 = Math.max(pair[0], adjustingViewBox.x2);
            adjustingViewBox.y2 = Math.max(pair[1], adjustingViewBox.y2);
          }
        }); //22.0 19.0 32.0 37.5
        container.root[1].viewBoxTemp = adjustingViewBox;
      }
      if (node.name === 'svg') {
        if (attrs.viewBoxTemp) {
          attrs.viewBox = [
            attrs.viewBoxTemp.x1,
            attrs.viewBoxTemp.y1,
            attrs.viewBoxTemp.x2 - attrs.viewBoxTemp.x1,
            attrs.viewBoxTemp.y2 - attrs.viewBoxTemp.y1
          ].join(' ');
        }
        attrs.focusable = 'false';
        attrs.unselectable = 'true';
        delete attrs.width;
        delete attrs.height;
        delete attrs.enableBackground;
        delete attrs.viewBoxTemp;
      }
      container([node.name, attrs, children]);
    }
  }
};

Promise.all(svgFiles.filter(svgFile => {
  return typeof svgFile !== 'undefined' && svgFile.trim().length > 0;
}).map(svgFile => {
  return new Promise((resolve) => {
    fs.readFile(svgFile, (err, data) => {
      if (err) {
        reject(err);
      } else {
        const name = path.basename(svgFile);
        processNode(htmlparser.parseDOM(data, {xmlMode: true}), (icon) => {
          resolve({
            name: name,
            json: JSON.stringify(icon)
          });
        }, name);
      }
    });
  });
}))
  .then(results => {
    return Promise.all(results.map(result => {
      return new Promise((resolve, reject) => {
        const outputFile = path.resolve(outputDir, `${result.name}.json`);
        fs.writeFile(outputFile, result.json, (err) => {
          if (err) {
            reject(err);
          } else {
            resolve(outputFile);
          }
        });
      });
    }));
  })
  .then(results => {
    results.forEach(result => {
      console.log('wrote', result);
    });
  })
  .catch(err => {
    console.log(err);
    process.exit(1);
  });

