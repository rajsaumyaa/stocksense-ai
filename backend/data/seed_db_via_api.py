import os
import requests

def seed_database_via_api():
    base_url = "https://stocksense-backend.onrender.com/api"
    
    # 1. Register default user
    print("[API Seed] Registering default manager...")
    register_url = f"{base_url}/auth/register"
    user_data = {
        "name": "Store Manager",
        "email": "manager@retailstore.com",
        "password": "password123"
    }
    
    try:
        res = requests.post(register_url, json=user_data)
        if res.status_code == 201:
            print("[API Seed] Manager registered successfully.")
        else:
            print(f"[API Seed] Manager registration status: {res.status_code} (User may already exist)")
    except Exception as e:
        print(f"[API Seed] Registration error (continuing to login): {e}")

    # 2. Login to get JWT Token
    print("[API Seed] Logging in to retrieve JWT access token...")
    login_url = f"{base_url}/auth/login"
    login_payload = {
        "username": "manager@retailstore.com",
        "password": "password123"
    }
    
    try:
        res = requests.post(login_url, data=login_payload)
        res.raise_for_status()
        token = res.json()["access_token"]
        print("[API Seed] Login successful. JWT token acquired.")
    except Exception as e:
        print(f"[API Seed] Login failed: {e}")
        return

    # Header for authenticated requests
    headers = {
        "Authorization": f"Bearer {token}"
    }

    # 3. Upload Sample CSV
    csv_path = "backend/data/sample_retail_data.csv"
    print(f"[API Seed] Uploading and cleaning dataset from: {csv_path}...")
    upload_url = f"{base_url}/upload"
    
    try:
        with open(csv_path, "rb") as f:
            files = {"file": (os.path.basename(csv_path), f, "text/csv")}
            res = requests.post(upload_url, headers=headers, files=files)
            res.raise_for_status()
            upload_result = res.json()
            print("[API Seed] CSV Upload Success!")
            print(f"  Processed rows: {upload_result['metrics']['total_rows_processed']}")
            print(f"  Products created/updated: {upload_result['metrics']['products_upserted']}")
            print(f"  Sales transactions recorded: {upload_result['metrics']['sales_recorded']}")
    except Exception as e:
        print(f"[API Seed] CSV Upload failed: {e}")
        if 'res' in locals():
            print(f"  Response detail: {res.text}")
        return

    # 4. Trigger XGBoost Model Training
    print("[API Seed] Triggering XGBoost demand forecasting model training (this might take a few seconds)...")
    train_url = f"{base_url}/train"
    
    try:
        res = requests.post(train_url, headers=headers)
        res.raise_for_status()
        train_result = res.json()
        print("[API Seed] Model Training Success!")
        print(f"  Evaluation R2 Score: {train_result['metrics']['r2_score']:.4f}")
        print(f"  Mean Squared Error (MSE): {train_result['metrics']['mse']:.2f}")
        print(f"  Model Confidence: {train_result['metrics']['confidence_score']}%")
    except Exception as e:
        print(f"[API Seed] Model training failed: {e}")

if __name__ == "__main__":
    seed_database_via_api()
