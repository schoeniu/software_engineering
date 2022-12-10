import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import  https from 'https';
    
export const handler = async(event) => {

    //extract image names from get request parameters
    const imgNameParams = Object.keys(event.queryStringParameters).map(function(key){
        return event.queryStringParameters[key];
    });
    //prepare generating S3 get URLs
    const client = new S3Client({ region: 'eu-central-1' });
    const urlPromises = imgNameParams.map(i => {
        const getObjectParams = {
            Bucket: 'dlmcspse01-images',
            Key: `${i}`
        };
        const command = new GetObjectCommand(getObjectParams);
        return getSignedUrl(client, command, { expiresIn: 60 });
    });
    //wait for S3 get URLs to be generated
    const urls = await Promise.allSettled(urlPromises).then((promises) => {
      return promises.map(p => p.value);
    });
    
    //prepare Everypixel API request options
    const defaultOptions = {
        protcol: 'https:',
        host: 'api.everypixel.com',
        port: 443,
        headers: {
         'Content-Type': 'application/json',
         'Authorization': '<credentials should not be commited to git>'
        }
    };
    //call API
    const keywordPromises = urls.map(u => callEverypixel(defaultOptions, '/v1/keywords?url='+encodeURIComponent(u), ''));
    const keywords = await Promise.allSettled(keywordPromises).then((promises) => {
        return promises.map(p => p.value);
    });
    //check if any API call failed
    for(const k of keywords){
        if(typeof k ==='string' && JSON.parse(k).status === 'error'){
            return {
                statusCode: 500,
                body: JSON.stringify(keywords),
            };
        }
    }
    //return keywords
    return {
        statusCode: 200,
        body: JSON.stringify(keywords),
    };
};

//function for executing get request to Everypixel API
const callEverypixel = (defaultOptions, path, payload) => new Promise((resolve, reject) => {
    const options = { ...defaultOptions, path, method: 'GET' };
    const req = https.request(options, res => {
        let buffer = "";
        res.on('data', chunk => {
            console.log(chunk);
            return buffer += chunk});
        res.on('end', () => resolve(JSON.parse(buffer)));
    });
    req.on('error', e => reject(e.message));
    req.write(JSON.stringify(payload));
    req.end();
});