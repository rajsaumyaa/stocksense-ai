import os
import shutil
from app.config import settings

class CloudStorageService:
    def __init__(self):
        self.bucket_name = settings.GCP_BUCKET_NAME
        self.use_local = True
        
        # Check if we have GCP configuration
        if self.bucket_name and settings.GOOGLE_APPLICATION_CREDENTIALS:
            try:
                from google.cloud import storage
                self.client = storage.Client()
                self.bucket = self.client.bucket(self.bucket_name)
                self.use_local = False
                print(f"[GCS] Initialized GCS client with bucket '{self.bucket_name}'")
            except Exception as e:
                print(f"[GCS] Failed to initialize GCS client: {e}. Falling back to local storage.")
        else:
            print("[GCS] GCP credentials not fully set. Using local storage fallback.")
            
        if self.use_local:
            # Create local storage directory
            os.makedirs(settings.LOCAL_STORAGE_DIR, exist_ok=True)
            self.storage_dir = settings.LOCAL_STORAGE_DIR
            print(f"[GCS] Local storage fallback configured at: {os.path.abspath(self.storage_dir)}")

    def upload_file(self, file_path: str, destination_blob_name: str) -> str:
        """
        Uploads a file to GCS (or copies to local storage fallback).
        Returns the path or GCS URI.
        """
        if not self.use_local:
            try:
                blob = self.bucket.blob(destination_blob_name)
                blob.upload_from_filename(file_path)
                return f"gs://{self.bucket_name}/{destination_blob_name}"
            except Exception as e:
                print(f"[GCS] GCS Upload failed: {e}. Attempting local save.")
        
        # Local fallback
        dest_path = os.path.join(self.storage_dir, destination_blob_name)
        os.makedirs(os.path.dirname(dest_path), exist_ok=True)
        shutil.copy2(file_path, dest_path)
        return dest_path

    def download_file(self, source_blob_name: str, destination_file_path: str) -> str:
        """
        Downloads a file from GCS (or copies from local storage fallback).
        """
        os.makedirs(os.path.dirname(destination_file_path), exist_ok=True)
        if not self.use_local:
            try:
                blob = self.bucket.blob(source_blob_name)
                blob.download_to_filename(destination_file_path)
                return destination_file_path
            except Exception as e:
                print(f"[GCS] GCS Download failed: {e}. Trying local storage.")
                
        # Local fallback
        local_src_path = os.path.join(self.storage_dir, source_blob_name)
        if os.path.exists(local_src_path):
            shutil.copy2(local_src_path, destination_file_path)
            return destination_file_path
        else:
            raise FileNotFoundError(f"File {source_blob_name} not found in GCS or local storage.")

    def list_files(self) -> list[str]:
        """
        Lists available datasets.
        """
        if not self.use_local:
            try:
                blobs = self.bucket.list_blobs()
                return [blob.name for blob in blobs]
            except Exception as e:
                print(f"[GCS] GCS list failed: {e}.")
        
        # Local fallback
        if os.path.exists(self.storage_dir):
            files = []
            for root, _, filenames in os.walk(self.storage_dir):
                for filename in filenames:
                    rel_path = os.path.relpath(os.path.join(root, filename), self.storage_dir)
                    files.append(rel_path.replace("\\", "/"))
            return files
        return []

storage_service = CloudStorageService()
