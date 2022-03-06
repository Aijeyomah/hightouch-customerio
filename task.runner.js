const HandleRequest  = require('./handle.request')
const { validateField } = require('./util')

class TaskRunner {

    constructor(config, data) {

        this.MAX_RETRIES = 3
        this.runningTasks = 0
        this.completedTasks = 0
        this.data = data
        this.MAX_PARALLELISM = config.parallelism
        this.mappings = config.mappings
        this.userId = config.userId
        this.auth = {
            site_id: config.site_id,
            api_key: config.api_key
        }
        this.request = new HandleRequest(this.auth)


    }


    customerURL(customerId) {

        if (validateField(customerId)) {
            throw new Error('customerId');
        }
        return `https://track-eu.customer.io/api/v1/customers/${customerId}`
    }

    /*
    Performs the logic of upserting/creating new customer on customer.io
    Based on the mappings. See task requirement
    */

    addOrUpsertCustomer(sourceData) {
        // Extract fields from sourceData based on this.config.mappings e.g
        this.MAX_PARALLELISM = sourceData.length < this.MAX_PARALLELISM ? sourceData.length : this.MAX_PARALLELISM;
        const customerData = [];
        const mappedUserData = {};
        for (let i = 0; i < this.MAX_PARALLELISM; i++) {
            
            let data = sourceData[i]
            for (let { to, from } of this.mappings) {
                mappedUserData[to] = data[from]
            }
            customerData.push(this.request.put(this.customerURL(data.email), mappedUserData))
        }
        
       return customerData;
    };

    errorIsRetryAble(statusCode){
      return  statusCode === 408 || statusCode === 502 ||  statusCode === 504 ||  statusCode === 503
    }

    /*
    Executes a task, which is a function to be called and the data to pass
    To the function
    */
    async run() {
        let noOfTries = 0;
        let taskSuccessful = false
        console.log(this.data.length);
      while (this.data.length) {
            try {
              await  Promise.all(this.addOrUpsertCustomer(this.data))
                taskSuccessful = true
                this.data.splice(0, this.MAX_PARALLELISM)
                console.log(this.data.length);
            } catch (e) {
                /*
                Log error object
                Check if customer.io returns a retriable flag e.g maybe if error is due to apiRateLimit
                */

                if (this.errorIsRetryAble) {
                    noOfTries++
                }
            }
        }


    }


}

module.exports = TaskRunner;