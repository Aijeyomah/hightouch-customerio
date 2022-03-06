const { readFile, readFileSync } = require('fs')
const TaskRunner = require("./task.runner");
const { checkIfFileExists } = require('./util');



const validateFile = (args) => {
  return  args.forEach((file) => {
      const statsObj =  checkIfFileExists(file)
      if(!statsObj.size){
        throw  new Error('Provide a valid file')
       }
    })
}

(async()=> {
    try {
        const configFile = process.argv[2]; 
        if(!configFile){
            throw  new Error('provide a config file')
        }
       checkIfFileExists(configFile)
        
        const dataFile = process.argv[3]
        if(!dataFile){
            throw  new Error('provide a data file')
        }
        checkIfFileExists(dataFile)
        const configObj = JSON.parse(readFileSync(configFile));
        const dataObj = JSON.parse(readFileSync(dataFile));

       const taskRunner = new TaskRunner(configObj, dataObj);
       await taskRunner.run()

    } catch (error) {
        console.log(error);
    }
})().then(_ => { console.log('::::: Updates completed :::::::'); process.exit(0) })
.catch( e => { console.log(':::: Failed to complete , critical error occured :::::', e); process.exit(1)});



    