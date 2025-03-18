const yaml = require('js-yaml');
const fs   = require('fs');

const filePath = process.argv.pop();
const UrlMap = new Map();

try {
    const yamlDoc = yaml.load(fs.readFileSync(filePath, 'utf8'));

    yamlDoc.forEach(urlEntry => { UrlMap.set(urlEntry.url, {...urlEntry, 'urlRequestsMade': 0, 'urlResponsesReceivedSuccessfully': 0});})

    makeTargetHealthcheckRequests();

    setInterval(makeTargetHealthcheckRequests, 15000)
} catch (e) {
    console.error('Error: ', e);
}

function makeTargetHealthcheckRequests() {
    UrlMap.forEach(urlEntry => {
        let requestStartTime;
        const newRequest =  new Promise((resolve, reject) => {
            try {
                requestStartTime = (new Date()).getTime();
                return resolve(makeRequest(urlEntry))
            } catch (e) {
                console.error('reject, Error: ', e)
                return reject(e);
            }
        })

        newRequest.then(res => {
            const requestEndTime = (new Date()).getTime();
            const responseTimeMs = (requestEndTime - requestStartTime);

            if (responseTimeMs < 500 && res.status >= 200 && res.status < 300) {
                console.log(`${urlEntry.url} Response time and status code is valid, stored as UP`);
                urlEntry.urlResponsesReceivedSuccessfully++
            } else {
                if (responseTimeMs >= 500) {
                    console.warn(`${urlEntry.url} Response time ${responseTimeMs} is invalid, processed as DOWN and not stored`);
                } else {
                    console.warn(`${urlEntry.url} Response status code ${res.status} is invalid, processed as DOWN and not stored`);
                }
            }

            console.log(`${urlEntry.url} has ${Math.round((urlEntry.urlResponsesReceivedSuccessfully / urlEntry.urlRequestsMade) * 100)}% availability percentage`)
        })
    })
}

async function makeRequest(urlEntry, method='GET') {
    let config = {
        method: urlEntry.method || 'GET',
        ...(urlEntry.body && { body: JSON.stringify(urlEntry.body) }),
        ...(urlEntry.headers && { headers: urlEntry.headers }),
    }
    try {
        urlEntry.urlRequestsMade++
        return await fetch(urlEntry.url, config);
    } catch (e) {
        console.error('makeRequest, failed to make call, Error: ', e);
    }
}
