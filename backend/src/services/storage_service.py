"""
S3-compatible object storage service (MinIO in dev, S3 in production).
"""
import asyncio
import logging
from typing import Optional

import boto3
from botocore.exceptions import ClientError

from src.config import settings

logger = logging.getLogger(__name__)


class StorageService:
    def __init__(self):
        self._client = boto3.client(
            "s3",
            endpoint_url=settings.s3_endpoint_url,
            aws_access_key_id=settings.s3_access_key,
            aws_secret_access_key=settings.s3_secret_key,
            region_name=settings.s3_region,
        )
        self._bucket = settings.s3_bucket_name

    def _make_key(self, project_id: str, file_path: str) -> str:
        return f"{project_id}/{file_path}"

    async def put_object(
        self, key: str, content: str, content_type: str = "text/plain"
    ) -> bool:
        """Upload content to S3."""
        try:
            await asyncio.to_thread(
                self._client.put_object,
                Bucket=self._bucket,
                Key=key,
                Body=content.encode("utf-8"),
                ContentType=content_type,
            )
            return True
        except ClientError as e:
            logger.error("S3 put_object failed for key %s: %s", key, e)
            return False

    async def get_object(self, key: str) -> Optional[str]:
        """Retrieve content from S3. Returns None if not found."""
        try:
            response = await asyncio.to_thread(
                self._client.get_object,
                Bucket=self._bucket,
                Key=key,
            )
            body = response["Body"].read()
            return body.decode("utf-8")
        except ClientError as e:
            if e.response["Error"]["Code"] == "NoSuchKey":
                return None
            logger.error("S3 get_object failed for key %s: %s", key, e)
            return None

    async def delete_object(self, key: str) -> bool:
        """Delete an object from S3."""
        try:
            await asyncio.to_thread(
                self._client.delete_object,
                Bucket=self._bucket,
                Key=key,
            )
            return True
        except ClientError as e:
            logger.error("S3 delete_object failed for key %s: %s", key, e)
            return False

    async def delete_prefix(self, prefix: str) -> bool:
        """Delete all objects under a prefix (e.g. an entire project)."""
        try:
            response = await asyncio.to_thread(
                self._client.list_objects_v2,
                Bucket=self._bucket,
                Prefix=prefix,
            )
            objects = response.get("Contents", [])
            if not objects:
                return True

            delete_request = {
                "Objects": [{"Key": obj["Key"]} for obj in objects],
                "Quiet": True,
            }
            await asyncio.to_thread(
                self._client.delete_objects,
                Bucket=self._bucket,
                Delete=delete_request,
            )
            return True
        except ClientError as e:
            logger.error("S3 delete_prefix failed for prefix %s: %s", prefix, e)
            return False

    async def object_exists(self, key: str) -> bool:
        """Check if an object exists."""
        try:
            await asyncio.to_thread(
                self._client.head_object,
                Bucket=self._bucket,
                Key=key,
            )
            return True
        except ClientError:
            return False

    async def health_check(self) -> bool:
        """Check if S3 is reachable."""
        try:
            await asyncio.to_thread(
                self._client.head_bucket,
                Bucket=self._bucket,
            )
            return True
        except ClientError:
            return False


storage_service = StorageService()
