
import json
import os
import urllib.parse
from datetime import datetime, timezone

import boto3

dynamodb = boto3.resource("dynamodb")
sns = boto3.client("sns")

TABLE_NAME = os.environ["DYNAMODB_TABLE"]
TOPIC_ARN = os.environ["SNS_TOPIC_ARN"]

table = dynamodb.Table(TABLE_NAME)


def lambda_handler(event, context):
    for record in event["Records"]:
        bucket = record["s3"]["bucket"]["name"]
        key = urllib.parse.unquote_plus(record["s3"]["object"]["key"])
        size_bytes = record["s3"]["object"]["size"]
        uploaded_at = datetime.now(timezone.utc).isoformat()

        table.put_item(
            Item={
                "file_key": key,
                "uploaded_at": uploaded_at,
                "bucket": bucket,
                "size_bytes": size_bytes,
            }
        )

        message = (
            f"New file uploaded.\n\n"
            f"Bucket: {bucket}\n"
            f"Key: {key}\n"
            f"Size: {size_bytes} bytes\n"
            f"Time: {uploaded_at}"
        )
        sns.publish(
            TopicArn=TOPIC_ARN,
            Subject=f"New upload: {key}",
            Message=message,
        )

    return {"statusCode": 200, "body": json.dumps("Processed successfully")}