const { parentPort, workerData } = require('node:worker_threads');
const process = require('node:process');

console.log("reminder job ran", workerData.foo);

if (parentPort) {
    parentPort.postMessage('done');
} else {
    process.exit(0);
}
