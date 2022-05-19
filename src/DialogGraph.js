
class DialogGraph {
    constructor() {
        this.nodes = {};
        this.edges = {};
        this.root = this.addNode("root");
        let setupPhaseNode = this.addNode("SetupPhase");
        this.addEdge("Setup phase required?", this.root, setupPhaseNode);
        let reminderSetupNode = this.addNode("ReminderSetup");
        this.addEdge("Setup reminder required?", setupPhaseNode, reminderSetupNode);
        let troiSetupNode = this.addNode("TroiSetup");
        this.addEdge("Setup troi required?", setupPhaseNode, troiSetupNode);
        let determineCalcPosNode = this.addNode("DetermineCalcPos");
        this.addEdge("Determining calculation position required?", troiSetupNode, determineCalcPosNode);
    }

    addNode(name) {
        let id = Object.keys(this.nodes).length;
        let node = new Node(id, name);
        this.nodes[id] = node;
        return node;
    }

    addEdge(name, source, target) {
        let id = Object.keys(this.edges).length;
        let edge = new Edge(id, name, source, target);
        this.edges[id] = edge;
        return edge;
    }

    generateMermaidMarkdown() {
        let markdown = "graph\n";
        Object.values(this.edges).forEach(edge =>
            markdown +=
                edge.source.id + "(" + edge.source.name + ")" +
                " -- " + edge.name + " --> " +
                edge.target.id + "(" + edge.target.name + ")\n"
        );
        return markdown;
    }
}

class Node {
    constructor(id, name) {
        this.id = id;
        this.name = name;
    }
}

class Edge {
    constructor(id, name, source, target) {
        this.id = id;
        this.name = name;
        this.source = source;
        this.target = target;
    }
}

module.exports = DialogGraph;
