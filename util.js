const fs = require("fs");
const checkIfFileExists = (filePath) => {
  let fileExist = false;
  try {
    const statsObj = fs.lstatSync(filePath, { throwIfNoEntry: true });
    fileExist = true;
    if (!statsObj.size) {
      throw new Error(`${filePath} cannot be empty`);
    }
    return true;
  } catch (error) {
    if (!fileExist) {
      throw new Error(`${filePath} does not exist`);
    } else {
      throw error.message;
    }
  }
};

const validateField = (value) =>
  value === undefined ||
  value === null ||
  (typeof value === "string" && value.trim() === "");

module.exports = { checkIfFileExists, validateField };
