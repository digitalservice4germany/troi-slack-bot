const config = require('../config.json');

let troiApi;

exports.startTroi = async () => {
    const TroiApiService = await import("../../troi-library/index.js"); // temporary TODO
    troiApi = new TroiApiService.default({
        baseUrl: config.TROI_API_URL,
        clientName: config.TROI_CLIENT_NAME,
        username: config.TROI_USERNAME,
        password: config.TROI_PASSWORD
    });
    await troiApi.initialize();
    console.log("Connection to the Troi API is initialized");
}

let nodes = {};
let services = {};

const buildNode = (id, name, type) => {
    return {
        simpleId: Object.keys(nodes).length,
        id: id,
        name: name,
        type: type,
        displayPath: "",
        children: []
    }
}

let root = buildNode("root", "root", "ROOT");
nodes["root"] = root;

exports.buildOrgGraph = async () => {
    let node;

    let projects = await troiApi.getAllProjects();
    for (let proj of projects) {
        node = buildNode(proj.Path, proj.Name, "PROJECT");
        nodes[node.id] = node;
        root.children.push(node.id)
    }

    let subprojects = await troiApi.getAllSubprojects();
    for (let subproj of subprojects) {
        node = buildNode(subproj.Path, subproj.Name, "SUBPROJECT");
        nodes[node.id] = node;
        let parentId = subproj.Project.Path;
        if (!nodes[parentId]) {
            node = buildNode(parentId, subproj.Project.Name, "PROJECT_VIA_SUBPROJECT");
            nodes[parentId] = node;
            root.children.push(node.id)
        }
        nodes[parentId].children.push(subproj.Path);
    }

    let calculationPositions = await troiApi.getAllCalculationPositions();
    for (let calculationPosition of calculationPositions) {
        node = buildNode(calculationPosition.Path, calculationPosition.Name, "CALCULATION_POSITION");
        node.displayPath = calculationPosition.DisplayPath;
        nodes[node.id] = node;
        nodes[calculationPosition.Subproject.Path].children.push(node.id);
        if (calculationPosition.Service) {
            services[calculationPosition.Service.Path] = calculationPosition.Service.Name;
        }
    }

    // console.log("nodes", nodes);
    // console.log("services", services);
    // exportOrgGraphAsTGF();
}

const exportOrgGraphAsTGF = () => {
    let data = "";
    // nodes
    Object.values(nodes).forEach(_node => {
        let name = _node.displayPath ? _node.displayPath : _node.name;
        data += _node.simpleId + " " + _node.id + " " + name + "\n";
    });
    data += "#\n";
    // edges
    Object.values(nodes).forEach(_node => {
        _node.children.forEach(childId => {
            data += _node.simpleId + " " + nodes[childId].simpleId + "\n";
        });
    });
    const fs = require('fs');
    fs.writeFile(__dirname + "/json/out.tgf", data, err => {
        if (err) return console.log(err);
        console.log("The file was saved");
    });
}

exports.storeEmployeeId = async (user) => {
    user.troi.employeeId = await troiApi.getEmployeeIdForUsername(user.troi.username);
}

exports.fetchPreviousCalculationPositions = async (user) => {
    let response = await troiApi.getCalculationPositionsLastRecorded(user.troi.employeeId);
    if (!response.length) return [];
    let previousCPs = [];
    for (let cp of response) {
        previousCPs.push({
            id: cp.cpId,
            path: cp.cpPath
        });
    }
    return previousCPs;
}
