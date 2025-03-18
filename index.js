const yaml = require('js-yaml');
const fs   = require('fs');

const filePath = process.argv.pop();

// create map for each entry in the array by url
// setTimeout, forEach entry in the map, fetch with method,
// and increment http requests made and http request the returned UP

const UrlMap = new Map();

try {
    const yamlDoc = yaml.load(fs.readFileSync(filePath, 'utf8'));

    yamlDoc.forEach(urlEntry => { UrlMap.set(urlEntry.url, {...urlEntry, 'urlRequestsMade': 0, 'urlResponsesReceivedSuccessfully': 0});})

    setInterval(() => {
        console.log('Timeout interval reached, calling urls');
        // we use the fetch API to make a request to the urls
        // we will also increment the urlRequ0estsMade
        UrlMap.forEach(urlEntry => {
            const requestStartTime = (new Date()).getTime();
            const newRequest =  new Promise((resolve, reject) => {
                try {
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
                    console.log('Response time and status code is valid, stored as UP');
                    urlEntry.urlResponsesReceivedSuccessfully++
                } else {
                    if (responseTimeMs >= 500) {
                        console.warn('Response time is invalid, processed as DOWN and not stored');
                        console.warn(responseTimeMs);
                    } else {
                        console.warn('Response status code is invalid, processed as DOWN and not stored');
                        console.warn(res.status);
                    }
                }
            })
        })

        console.log('::::End of Interval Stats::::');
        displayRequestResults(UrlMap)
    }, 5000)
} catch (e) {
    console.error('Error:');
    console.error(e);
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
        console.error('failed to make call, Error:')
        console.error(e);
    }
}

function displayRequestResults(UrlMap) {
    UrlMap.forEach(urlEntry => console.log(`${urlEntry.url} has ${Math.round((urlEntry.urlResponsesReceivedSuccessfully / urlEntry.urlRequestsMade) * 100)}% availability percentage`))
}