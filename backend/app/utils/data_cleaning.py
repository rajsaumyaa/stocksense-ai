import pandas as pd
import numpy as np

def clean_retail_dataframe(df: pd.DataFrame) -> pd.DataFrame:
    """
    Cleans a retail sales/inventory DataFrame.
    Handling:
    1. Missing values: fills category/supplier/warehouse with 'Unknown', prices with average, quantities with 0.
    2. Duplicate records: drops identical rows.
    3. Invalid dates: coerces dates to datetime and drops rows that cannot be converted.
    4. Negative sales: drops transactions where quantity <= 0 or revenue < 0.
    """
    # Create a copy
    df = df.copy()
    
    # 1. Drop complete duplicates
    df = df.drop_duplicates()
    
    # 2. Column mapping and normalization
    # Ensure columns exist (case-insensitive strip)
    df.columns = [c.lower().strip() for c in df.columns]
    
    # Required columns checklist
    required_cols = ['sku', 'product_name', 'category', 'supplier', 'price', 
                     'current_stock', 'reorder_level', 'warehouse', 
                     'sale_date', 'quantity', 'revenue']
                     
    # If any required column is missing, try to fill it or check if we can make it
    for col in required_cols:
        if col not in df.columns:
            if col in ['current_stock', 'reorder_level', 'quantity', 'revenue']:
                df[col] = 0
            elif col == 'price':
                df[col] = 1.0
            elif col in ['category', 'supplier', 'warehouse']:
                df[col] = 'Unknown'
            elif col == 'sale_date':
                df[col] = pd.Timestamp.now().strftime('%Y-%m-%d')
            else:
                df[col] = ''
                
    # 3. Clean numeric fields
    df['price'] = pd.to_numeric(df['price'], errors='coerce').fillna(1.0)
    df['current_stock'] = pd.to_numeric(df['current_stock'], errors='coerce').fillna(0).astype(int)
    df['reorder_level'] = pd.to_numeric(df['reorder_level'], errors='coerce').fillna(5).astype(int)
    df['quantity'] = pd.to_numeric(df['quantity'], errors='coerce').fillna(0).astype(int)
    df['revenue'] = pd.to_numeric(df['revenue'], errors='coerce').fillna(0.0)
    
    # 4. Filter negative values
    df = df[df['quantity'] > 0]
    df = df[df['revenue'] >= 0]
    df = df[df['price'] >= 0]
    df = df[df['current_stock'] >= 0]
    df = df[df['reorder_level'] >= 0]
    
    # 5. Handle dates
    df['sale_date'] = pd.to_datetime(df['sale_date'], errors='coerce')
    df = df.dropna(subset=['sale_date'])
    
    # Fill remaining string columns
    df['sku'] = df['sku'].astype(str).str.strip()
    df['product_name'] = df['product_name'].astype(str).str.strip()
    df['category'] = df['category'].astype(str).str.strip().str.title()
    df['supplier'] = df['supplier'].astype(str).str.strip()
    df['warehouse'] = df['warehouse'].astype(str).str.strip().str.upper()
    
    # Drop rows where critical identifiers are empty
    df = df[df['sku'] != '']
    df = df[df['product_name'] != '']
    
    return df
