from sqlalchemy import text
from .connection import Base, engine, get_db
from .models import User, Product, Inventory, Sale, Recommendation, Forecast

def init_db():
    # Create all tables
    Base.metadata.create_all(bind=engine)
    
    # Create database views for Looker Studio
    try:
        with engine.connect() as conn:
            # 1. Sales Trends View
            conn.execute(text("DROP VIEW IF EXISTS v_sales_trends"))
            conn.execute(text("""
                CREATE VIEW v_sales_trends AS
                SELECT 
                    s.sale_date, 
                    p.category, 
                    p.product_name, 
                    p.sku,
                    SUM(s.quantity) AS total_quantity, 
                    SUM(s.revenue) AS total_revenue
                FROM sales s
                JOIN products p ON s.product_id = p.id
                GROUP BY s.sale_date, p.category, p.product_name, p.sku;
            """))
            
            # 2. Inventory Health View
            conn.execute(text("DROP VIEW IF EXISTS v_inventory_health"))
            conn.execute(text("""
                CREATE VIEW v_inventory_health AS
                SELECT 
                    p.id AS product_id, 
                    p.sku, 
                    p.product_name, 
                    p.category, 
                    p.supplier, 
                    i.current_stock, 
                    i.reorder_level, 
                    i.warehouse,
                    CASE 
                        WHEN i.current_stock = 0 THEN 'OUT OF STOCK'
                        WHEN i.current_stock <= i.reorder_level THEN 'LOW STOCK'
                        WHEN i.current_stock > i.reorder_level * 3 THEN 'OVERSTOCK'
                        ELSE 'HEALTHY'
                    END AS stock_status
                FROM products p
                JOIN inventory i ON p.id = i.product_id;
            """))
            
            # 3. Demand Forecast View
            conn.execute(text("DROP VIEW IF EXISTS v_demand_forecast"))
            conn.execute(text("""
                CREATE VIEW v_demand_forecast AS
                SELECT 
                    f.forecast_date, 
                    p.product_name, 
                    p.category, 
                    p.sku,
                    f.predicted_sales, 
                    f.stockout_probability
                FROM forecast f
                JOIN products p ON f.product_id = p.id;
            """))
            
            conn.commit()
            print("[Database] Successfully created database views.")
    except Exception as e:
        print(f"[Database] Warning: Could not create database views: {e}")
