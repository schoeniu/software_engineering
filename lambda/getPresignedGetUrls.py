import json
import logging
import boto3
import botocore
from botocore.exceptions import ClientError

def create_presigned_url(bucket_name, object_name, expiration=600):
    # Generate a presigned URL for the S3 object
    s3_client = boto3.client('s3',region_name="eu-central-1",config=boto3.session.Config(signature_version='s3v4',))
    try:
        response = s3_client.generate_presigned_url('get_object',
                                                    Params={'Bucket': bucket_name,
                                                            'Key': object_name},
                                                    ExpiresIn=expiration)
    except Exception as e:
        print(e)
        logging.error(e)
        return "Error"
    # The response contains the presigned URL
    return response

def lambda_handler(event, context):
    URLs=[]
    if event.get('queryStringParameters',) is not None:
        for x in event.get('queryStringParameters').values():
            URLs.append(create_presigned_url('dlmcspse01-images',x,3600))

    return {
        'statusCode': 200,
        'body': json.dumps(URLs)
    }