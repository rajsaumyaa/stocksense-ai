import os
import shutil
import pandas as pd
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from sqlalchemy.orm import Session
from sqlalchemy import select, or_, and_, desc
from typing import Optional, List
from app.database import get_db, Product, Inventory, Sale
from app.services.cloud_storage import storage_service
from app.services.analytics import analytics_service
from app.utils.data_cleaning import clean_retail_dataframe
from app.routers.auth import get_current_user

router = APIRouter(prefix="", tags=["Data Ingestion & Store Statistics"])

@router.post("/upload", status_code=status.HTTP_200_OK)
def upload_csv(
    file: UploadFile = File(...), 
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Uploads a retail sales & inventory dataset, cleans it, uploads to GCS/Local,
    and populates PostgreSQL tables.
    """
    if not file.filename.endswith('.csv'):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file format. Please upload a CSV file."
        )

    # 1. Save locally temporarily
    temp_dir = "data/temp"
    os.makedirs(temp_dir, exist_ok=True)
    filename = os.path.basename(file.filename)
    temp_file_path = os.path.join(temp_dir, filename)
    
    with open(temp_file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    try:
        # 2. Upload to Cloud Storage (with local fallback)
        cloud_path = storage_service.upload_file(temp_file_path, f"datasets/{filename}")
        
        # 3. Read and Clean CSV
        df = pd.read_csv(temp_file_path)
        cleaned_df = clean_retail_dataframe(df)
        
        if cleaned_df.empty:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No valid records found in the CSV after cleaning (check negative values or invalid dates)."
            )

        # 4. Populate Database
        products_upserted = 0
        sales_recorded = 0
        
        # Track SKUs processed in this request to avoid multiple db lookups
        sku_to_product_id = {}
        processed_inventories = set()

        # Loop through rows and insert/update
        for index, row in cleaned_df.iterrows():
            sku = row['sku']
            
            # Check Product
            if sku in sku_to_product_id:
                product_id = sku_to_product_id[sku]
            else:
                db_prod = db.query(Product).filter(Product.sku == sku).first()
                if not db_prod:
                    db_prod = Product(
                        sku=sku,
                        product_name=row['product_name'],
                        category=row['category'],
                        supplier=row['supplier'],
                        price=row['price']
                    )
                    db.add(db_prod)
                    db.commit()
                    db.refresh(db_prod)
                    products_upserted += 1
                else:
                    # Update fields if product exists
                    db_prod.product_name = row['product_name']
                    db_prod.category = row['category']
                    db_prod.supplier = row['supplier']
                    db_prod.price = row['price']
                    db.commit()
                
                product_id = db_prod.id
                sku_to_product_id[sku] = product_id

            # Check / Update Inventory
            if product_id not in processed_inventories:
                db_inv = db.query(Inventory).filter(Inventory.product_id == product_id).first()
                if not db_inv:
                    db_inv = Inventory(
                        product_id=product_id,
                        current_stock=row['current_stock'],
                        reorder_level=row['reorder_level'],
                        warehouse=row['warehouse']
                    )
                    db.add(db_inv)
                else:
                    db_inv.current_stock = row['current_stock']
                    db_inv.reorder_level = row['reorder_level']
                    db_inv.warehouse = row['warehouse']
                processed_inventories.add(product_id)
            
            # Record Sale
            # Check if this sale transaction is already logged (avoid double counting duplicates)
            db_sale = db.query(Sale).filter(
                Sale.product_id == product_id,
                Sale.sale_date == row['sale_date'].date(),
                Sale.quantity == row['quantity']
            ).first()
            
            if not db_sale:
                db_sale = Sale(
                    product_id=product_id,
                    quantity=row['quantity'],
                    sale_date=row['sale_date'].date(),
                    revenue=row['revenue']
                )
                db.add(db_sale)
                sales_recorded += 1

        db.commit()
        
        return {
            "status": "success",
            "message": f"Data ingested successfully. Processed {len(cleaned_df)} rows.",
            "gcs_path": cloud_path,
            "metrics": {
                "total_rows_processed": len(cleaned_df),
                "products_upserted": products_upserted,
                "sales_recorded": sales_recorded
            }
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error parsing CSV dataset: {str(e)}"
        )
    finally:
        # Clean up temp upload file
        if os.path.exists(temp_file_path):
            os.remove(temp_file_path)

@router.get("/dashboard")
def get_dashboard_summary(db: Session = Depends(get_db)):
    """
    Returns aggregated KPIs, trends, category stats, and supplier performance for the main dashboard.
    """
    kpis = analytics_service.get_dashboard_kpis(db)
    sales_trends = analytics_service.get_sales_trends(db)
    categories = analytics_service.get_category_performance(db)
    suppliers = analytics_service.get_supplier_performance(db)
    
    # Calculate a simple average daily sales amount
    return {
        "kpis": kpis,
        "sales_trends": sales_trends,
        "category_breakdown": categories,
        "supplier_performance": suppliers
    }

@router.get("/products")
def get_products(db: Session = Depends(get_db)):
    """
    Lists all products.
    """
    return db.query(Product).all()

@router.get("/sales")
def get_sales(limit: int = 100, db: Session = Depends(get_db)):
    """
    Lists recent sales history.
    """
    results = db.query(Sale).order_by(desc(Sale.sale_date)).limit(limit).all()
    return [
        {
            "id": s.id,
            "product_id": s.product_id,
            "product_name": s.product.product_name,
            "sku": s.product.sku,
            "quantity": s.quantity,
            "sale_date": s.sale_date,
            "revenue": s.revenue
        } for s in results
    ]

@router.get("/inventory")
def get_inventory(
    category: Optional[str] = None,
    supplier: Optional[str] = None,
    warehouse: Optional[str] = None,
    low_stock: Optional[bool] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Fetches warehouse inventory levels with dynamic search, sorting, and filters.
    """
    query = db.query(Inventory).join(Product)
    
    # Search
    if search:
        query = query.filter(
            or_(
                Product.product_name.ilike(f"%{search}%"),
                Product.sku.ilike(f"%{search}%")
            )
        )
        
    # Filters
    if category and category != "All":
        query = query.filter(Product.category == category)
        
    if supplier and supplier != "All":
        query = query.filter(Product.supplier == supplier)
        
    if warehouse and warehouse != "All":
        query = query.filter(Inventory.warehouse == warehouse.upper())
        
    if low_stock:
        query = query.filter(Inventory.current_stock <= Inventory.reorder_level)
        
    results = query.order_by(Product.product_name).all()
    
    return [
        {
            "id": item.id,
            "product_id": item.product_id,
            "product_name": item.product.product_name,
            "sku": item.product.sku,
            "category": item.product.category,
            "supplier": item.product.supplier,
            "price": item.product.price,
            "current_stock": item.current_stock,
            "reorder_level": item.reorder_level,
            "warehouse": item.warehouse,
            "status": "LOW STOCK" if item.current_stock <= item.reorder_level else ("OVERSTOCK" if item.current_stock > item.reorder_level * 3 else "HEALTHY")
        } for item in results
    ]
