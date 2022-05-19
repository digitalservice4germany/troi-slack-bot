const fs = require("fs");
const DialogGraph = require("./DialogGraph");
const { mermaidHTMLwrapper } = require("./util");

let dialogGraph = new DialogGraph();
let markdown = dialogGraph.generateMermaidMarkdown();
let html = mermaidHTMLwrapper(markdown);
let file = "../mermaid.html";

fs.writeFile(file, html, err => {
    if (err) return console.log(err);
    console.log(file + " saved");
});
