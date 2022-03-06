const { readFileSync } = require("fs");
const TaskRunner = require("./task.runner");
const { checkIfFileExists } = require("./util");

(async () => {
  try {
    const configFile = process.argv[2];
    if (!configFile) {
      throw new Error("provide a config file");
    }
    checkIfFileExists(configFile);

    const dataFile = process.argv[3];
    if (!dataFile) {
      throw new Error("provide a data file");
    }
    checkIfFileExists(dataFile);
    const configObj = JSON.parse(readFileSync(configFile));
    const dataObj = JSON.parse(readFileSync(dataFile));
    const totalTasks = dataObj.length;
    const taskRunner = new TaskRunner(configObj, dataObj);
    await taskRunner.run();

    const stats = {
      "NO. Of Customers Recevied": totalTasks,
      "NO. Of Successful Upload": taskRunner.completedTasks,
    };

    return stats;
  } catch (error) {
    throw error;
  }
})()
  .then((stats) => {
    console.log(`::::: Updates completed :::::::`);
    console.table(stats);
    process.exit(0);
  })
  .catch((e) => {
    console.log(":::: Failed to complete , critical error occured :::::", e);
    process.exit(1);
  });
