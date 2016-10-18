'use strict';

const fs = require('fs'),
    path = require('path'),
    htmlparser = require('htmlparser2'),
    svgFile = process.argv[2],
    camelCase = (prop) => {
        return prop.replace(/[-|:]([a-z])/gi, (val, match) => match.toUpperCase());
    }, processNode = (node, container) => {
        if (Array.isArray(node)) {
            node.forEach((n) => processNode(n, container));
        } else {
            const attrs = {
                    focusable: "false",
                    unselectable: "false"
                },
                children = [];
            if (node.type === 'tag') {
                container.root = true;
                if (typeof container.root === 'undefined')
                    return;
                if (node.attribs) {
                    Object.keys(node.attribs).reduce((acc, cur) => {
                        acc[camelCase(cur)] = node.attribs[cur];
                        return acc;
                    }, attrs);
                }
                if (node.children) {
                    node.children.forEach((n) => processNode(n, (child) => {
                        children.push(child);
                    }));
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
    });
});

