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
                let maxX = 0,
                    maxY = 0,
                    minX = 99999,
                    minY = 99999;
                if (attrs.d) {
                    attrs.d.split(/[\s]+/).forEach((part) => {
                        let pair = part.split(/,/).map((value) => parseFloat(value));
                        if (pair.length === 2) {
                            maxX = Math.max(pair[0], maxX);
                            maxY = Math.max(pair[1], maxY);
                            minX = Math.min(pair[0], minX);
                            minY = Math.min(pair[1], minY);
                        }
                    });
                    container.root[1].viewBox = `${minX} ${minY} ${maxX - minX} ${maxY - minY}`;
                }
                if (node.name === 'svg') {
                    delete attrs.width;
                    delete attrs.height;
                    delete attrs.enableBackground;
                    attrs.focusable = 'false';
                    attrs.unselectable = 'true';
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

