import argparse
from google.cloud import storage, firestore
import json

# Initialize the Firestore client
firestore_client = firestore.Client()

# Initialize the Google Cloud Storage client
storage_client = storage.Client()

def upload_json_to_firestore(bucket_name, file_name, collection_name, doc_id_field=None):
    """
    Fetches a JSON file from Google Cloud Storage, parses it, and uploads the data to a Firestore collection.
    
    :param bucket_name: The name of the Google Cloud Storage bucket.
    :param file_name: The JSON file name in the Cloud Storage bucket.
    :param collection_name: The Firestore collection name where the data will be uploaded.
    :param doc_id_field: The JSON field to use as the document ID. If None, Firestore will auto-generate document IDs.
    """
    try:
        # Get the GCS bucket
        bucket = storage_client.bucket(bucket_name)
        
        # Get the blob (file) from the bucket
        blob = bucket.blob(file_name)
        
        # Download the JSON content as string
        json_content = blob.download_as_string()

        # Parse the JSON content
        data = json.loads(json_content)

        # Ensure the data is either a list (array of JSON objects) or a single dictionary
        if isinstance(data, dict):
            data = [data]  # Convert single object to list for consistent processing
        
        if not isinstance(data, list):
            raise ValueError("Expected JSON data to be a list or a single JSON object.")
        
        # Reference the Firestore collection
        collection_ref = firestore_client.collection(collection_name)

        # Loop through the dictionary (assuming it's a list of dictionaries)
        for entry in data:
            if not isinstance(entry, dict):
                raise ValueError(f"Expected each item in the list to be a dictionary, but got: {type(entry)}")
            
            if doc_id_field:
                collection_ref.document(doc_id_field).set(entry)
                print(f"Uploaded document with ID: {doc_id_field}")
    
    except Exception as e:
        print(f"An error occurred: {e}")

# Setup argparse to handle command-line arguments
def main():
    parser = argparse.ArgumentParser(description="Upload JSON data from GCS to Firestore.")
    
    parser.add_argument('bucket_name', help="The Google Cloud Storage bucket name where the JSON file is located.")
    parser.add_argument('file_name', help="The JSON file name (path) in the bucket.")
    parser.add_argument('collection_name', help="The Firestore collection name to upload the JSON data to.")
    parser.add_argument('doc_id_field', help="The JSON field to use as the Firestore document ID.", default=None)
    
    args = parser.parse_args()

    # Call the function to upload the JSON to Firestore
    upload_json_to_firestore(args.bucket_name, args.file_name, args.collection_name, args.doc_id_field)

if __name__ == '__main__':
    main()
