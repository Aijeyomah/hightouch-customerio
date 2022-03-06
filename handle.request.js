const { request } = require("https");
const { URL }  = require( "url");
let i = 0;
class HandleRequest {
	constructor(accountAuth) {
		this.siteId = accountAuth.site_id;
		this.apiKey = accountAuth.api_key;

		this.auth = `Basic ${Buffer.from(
			`${this.siteId}:${this.apiKey}`,
			"utf8"
		).toString("base64")}`;
	}

	requestOptions(method, uri, data) {
		const requestBody = data ? JSON.stringify(data) : null;

		const headers = {
			Authorization: this.auth,
			"Content-Length": requestBody ? Buffer.byteLength(requestBody, "utf8") : 0,
			"Content-Type": "application/json",
			"User-Agent": "hightouch.io/1.0",
		};
		return { method, uri, headers, requestBody };
	}

    handleJson(resBody, res, callback){
        try {
            if (res.headers["content-type"].includes("application/json")) {
                if (resBody && resBody.length) {
                    return JSON.parse(resBody);
                }
                return null;
            }
            
          } catch (error) {
            const message = `Unable to parse JSON. Error: ${error} \nBody:\n ${body}`;
             return callback(new Error(message));
          }
    }

	handleRequest({ method, uri, headers, requestBody }) {
		return new Promise((resolve, reject) => {
			let url = new URL(uri);
			const reqOptions = {
				hostname: url.hostname,
				path: url.pathname,
				method,
				headers,
				timeout: 5000
			};
			
		const req = request(reqOptions, (res) => {
				const chunks = [];
				res.on("data", (data) => {
					chunks.push(data);
					console.log(data);
				});
				res.on("end", () => {
					let resBody = Buffer.concat(chunks).toString('utf-8');
                    //let result = this.handleJson(resBody, res, reject);
                    if (res.statusCode == 200 || res.statusCode == 201) {
                        resolve(true);
                      } else {
                        reject(resBody.error);
                      }
                
				});
			});
			req.on("error", reject);
			if (requestBody) {
				req.write(requestBody);
			}
			req.end();
		});
	}

	put(uri, data) {
		return this.handleRequest(this.requestOptions('PUT', uri, data));
	}

	get(uri) {
		return this.handleRequest(this.requestOptions( 'GET' ,uri));
	}


}

module.exports = HandleRequest;
