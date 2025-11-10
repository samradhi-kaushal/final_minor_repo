# api/signals.py (overwrite upload_file_to_s3 with the following)
import os
import boto3
import logging
from django.conf import settings
from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import SecureFile

logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

@receiver(post_save, sender=SecureFile)
def upload_file_to_s3(sender, instance, created, **kwargs):
    logger.info("Signal triggered for SecureFile id=%s created=%s", getattr(instance, 'pk', None), created)

    if not getattr(instance, 'file', None):
        logger.info("No file attached to instance, skipping.")
        return

    try:
        local_path = instance.file.path
    except Exception as e:
        logger.exception("Could not get instance.file.path: %s", e)
        return

    if not os.path.exists(local_path):
        logger.error("Local file missing: %s", local_path)
        return

    # Get bucket and region and log their types/values
    bucket = getattr(settings, 'AWS_STORAGE_BUCKET_NAME', None)
    region = getattr(settings, 'AWS_S3_REGION_NAME', None)
    logger.info("AWS bucket raw value: %r (type=%s)", bucket, type(bucket))
    logger.info("AWS region: %r", region)

    # Defensive checks
    if not bucket:
        logger.error("AWS_STORAGE_BUCKET_NAME is not set. Check your .env and settings.py")
        return
    if not isinstance(bucket, str):
        try:
            bucket = str(bucket)
            logger.warning("Converted bucket to string: %r", bucket)
        except Exception:
            logger.error("Bucket value is not convertible to string: %r", bucket)
            return
    bucket = bucket.strip()

    key = f"secure_vault_files/{os.path.basename(instance.file.name)}"
    logger.info("Uploading to bucket=%s key=%s region=%s", bucket, key, region)

    s3 = boto3.client(
        's3',
        aws_access_key_id=getattr(settings, 'AWS_ACCESS_KEY_ID', None),
        aws_secret_access_key=getattr(settings, 'AWS_SECRET_ACCESS_KEY', None),
        region_name=region
    )

    try:
        s3.upload_file(local_path, bucket, key)
        logger.info("S3 upload success: %s/%s", bucket, key)
    except Exception as e:
        logger.exception("S3 upload failed for %s: %s", local_path, e)
