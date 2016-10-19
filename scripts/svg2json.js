'use strict';

const fs = require('fs'),
    path = require('path'),
    htmlparser = require('htmlparser2'),
    svgFile = process.argv[2],
    camelCase = (prop) => {
        return prop.replace(/[-|:]([a-z])/gi, (val, match) => match.toUpperCase());
    }, processNode = (node, container, iconId) => {
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
                    if(attrs.viewBoxTemp) {
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

if (typeof svgFile === 'undefined' || svgFile.trim() === '') {
    console.log('svgFile not supplied');
    process.exit(1);
}

fs.readFile(svgFile, 'utf8', (err, data) => {
    processNode(htmlparser.parseDOM(data, {xmlMode: true}), (icon) => {
        console.log(JSON.stringify(icon));
    }, path.basename(svgFile));
});

