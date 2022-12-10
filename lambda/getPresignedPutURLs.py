import json
import logging
import boto3
import botocore
from botocore.exceptions import ClientError

def create_presigned_url(bucket_name, object_name, expiration=120):
    # Generate a presigned URL for the S3 object
    s3_client = boto3.client('s3',region_name="eu-central-1",config=boto3.session.Config(signature_version='s3v4',))
    try:
        response = s3_client.generate_presigned_url('put_object',
                                                    Params={'Bucket': bucket_name,
                                                            'Key': object_name},
                                                    ExpiresIn=expiration)
    except Exception as e:
        return "Error"
    # The response contains the presigned PUT URL
    return response

def lambda_handler(event, context):
    URLs=[]
    #create presigned S3 PUT URL for every image name given through request parameters
    if event.get('queryStringParameters',) is not None:
        for x in event.get('queryStringParameters').values():
            URLs.append(create_presigned_url('dlmcspse01-images',x,120))
    #return presigned S3 PUT URLs
    return {
        'statusCode': 200,
        'body': json.dumps(URLs)
    }