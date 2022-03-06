const HandleRequest  = require('./handle.request')
const { validateField } = require('./util')

class TaskRunner {

    constructor(config, data) {

        this.MAX_RETRIES = 1
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
      return  [408, 500, 502, 503, 504, 522, 524].includes(statusCode)
    }

    errorIsNotRetryAble(statusCode){
        return statusCode !== 200 && statusCode !== 201 && !this.errorIsRetryAble(statusCode)
    }

    retryTasks(data, time){
        const store = []; 
         data.forEach(({reason, value }, i) => {
             let  statusCode = value || reason // reason when rejected and value when failure
            if(this.errorIsNotRetryAble(statusCode)){
                //  not retryable error
                console.log(`Error occurred when upserting task for ${this.data[i].email}`)
             }
           else if(this.errorIsRetryAble(reason)){
                if(time === this.MAX_RETRIES){
                    // still failed after max retry
                    console.log(`failed to upsert task for ${this.data[i].email}`)
                }
                    store.push(this.data[i])
            } else{
            console.log(`successfully to upsert task for ${this.data[i].email}`)
            }
                
            });
            return store;
    }

    async retry(data, noOfTries) {
        if(data.length && noOfTries < 1 ){
            const results =  await  Promise.allSettled(this.addOrUpsertCustomer(data));
         
           const retryAbleTask = this.retryTasks(results, 1 )
        
        if(retryAbleTask.length){
            noOfTries++
        }
    }
    }

    /*
    Executes a task, which is a function to be called and the data to pass
    To the function
    */
    async run() {
        let noOfTries = 0;
      while (this.data.length && noOfTries < 1) {
            try {
             const results =  await  Promise.allSettled(this.addOrUpsertCustomer(this.data));
             const retryAbleTask = this.retryTasks(results)
             
            if(retryAbleTask && retryAbleTask.length){
               await this.retry(retryAbleTask, noOfTries)
            }
                console.log('::::::::::::::::::::::::::::::::completed batch upsert:::::::::::::::::::::::::::::');
                this.data.splice(0, this.MAX_PARALLELISM)
            } catch (e) {
                /*
                Log error object
                Check if customer.io returns a retriable flag e.g maybe if error is due to apiRateLimit
                */

              console.log(e)
            }
        }


    }


}

module.exports = TaskRunner;