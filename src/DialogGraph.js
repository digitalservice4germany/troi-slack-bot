
class DialogGraph {
    constructor() {
        this.nodes = {};
        this.edges = {};
        this.root = this.addNode("root");

        let setupPhase = this.addNode("SetupPhase",
            "Let's setup some things, it won't take long.");
        let reminderSetup = this.addNode("ReminderSetup");

        let identifyPositions = this.addNode("identifyPositions",
            "Alright, let's find out where your time bookings should go. " +
            "I found these positions that you previously booked times on: xyz, is this still accurate or is something missing or meanwhile outdated? " +
            "Ok, I would like to know which projects you are on and then please help me identify the so called \"positions\" within those projects " +
            "that you are booking time on.");
        let suggestPreviouslyUsedPositions = this.addNode("suggestPreviouslyUsedPositions");

        let troiSetup = this.addNode("TroiSetup",
            "Are you planning to use me (sometimes) for booking your time in Troi" +
            " or do you only want me to remind you regularly to book your hours (in another tool)?");
        let determineProjects = this.addNode("determineProjects");
        let determineRole = this.addNode("determineRole");
        let determinePositionsWithinProjects = this.addNode("determinePositionsWithinProjects");

        this.addEdge("auto", this.root, setupPhase);
        this.addEdge("1", setupPhase, troiSetup);
        this.addEdge("2", setupPhase, reminderSetup);

        this.addEdge("no", troiSetup, reminderSetup);
        this.addEdge("yes", troiSetup, identifyPositions);

        this.addEdge("auto", identifyPositions, suggestPreviouslyUsedPositions);

        this.addEdge("not sufficient", suggestPreviouslyUsedPositions, determineProjects);
        this.addEdge("sufficient", suggestPreviouslyUsedPositions, reminderSetup);
        this.addEdge("auto", determineProjects, determineRole);
        this.addEdge("auto", determineRole, determinePositionsWithinProjects);
    }

    addNode(name, prompt) {
        let id = Object.keys(this.nodes).length;
        let node = new Node(id, name, prompt);
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
    constructor(id, name, prompt) {
        this.id = id;
        this.name = name;
        this.prompt = prompt;
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
