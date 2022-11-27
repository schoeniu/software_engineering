import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import  https from 'https';
    
export const handler = async(event) => {

    const client = new S3Client({ region: 'eu-central-1' });
    var imgNameParams = Object.keys(event.queryStringParameters).map(function(key){
        return event.queryStringParameters[key];
    });

    const urlPromises = imgNameParams.map(i => {
        const getObjectParams = {
            Bucket: 'dlmcspse01-images',
            Key: `${i}`
        };
        const command = new GetObjectCommand(getObjectParams);
        return getSignedUrl(client, command, { expiresIn: 3600 });
    });
    const resolvedPromises = await Promise.allSettled(urlPromises).then((values) => {
      //console.log(values);
      return values;
    });
    const urls = Array.from(resolvedPromises).map(p => {
        console.log('\n\n'+p.value+'\n');
        return p.value;
    });
    
    //Call Everypixel API
    const defaultOptions = {
        protcol: 'https:',
        host: 'api.everypixel.com',
        port: 443,
        headers: {
         'Content-Type': 'application/json',
         'Authorization': '<credentials should not be commited to git>'
        }
    };
    
    const keywordPromises = urls.map(u => getStatus(defaultOptions, '/v1/keywords?url='+encodeURIComponent(u), ''));
    const resolvedKeywordPromises = await Promise.allSettled(keywordPromises).then((values) => values );
    const keywords = Array.from(resolvedKeywordPromises).map(p => {
        console.log('\n\n'+p.value+'\n');
        return p.value;
    });
    
    return {
        statusCode: 200,
        body: JSON.stringify(keywords),
    };
};

const getStatus = (defaultOptions, path, payload) => new Promise((resolve, reject) => {
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
})