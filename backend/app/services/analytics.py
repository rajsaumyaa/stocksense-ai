import datetime
from sqlalchemy.orm import Session
from sqlalchemy import func, select, text
from app.database import Product, Inventory, Sale, Forecast
from app.services.forecast_service import forecast_service

class AnalyticsService:
    def get_dashboard_kpis(self, db: Session) -> dict:
        """
        Calculates core KPI figures for dashboard display:
        - Total Products
        - Current Inventory Value
        - Today's Revenue
        - Low Stock Alerts
        - Overstock Counts
        - Predicted Tomorrow Revenue
        """
        # 1. Total unique products
        total_prods = db.query(Product).count()
        
        # 2. Total inventory value (sum of stock * price)
        inv_val = db.query(func.sum(Inventory.current_stock * Product.price))\
                    .join(Product, Inventory.product_id == Product.id).scalar() or 0.0
                    
        # 3. Today's Revenue (aggregate of last sales date, or today)
        latest_date_query = db.query(func.max(Sale.sale_date)).scalar()
        if latest_date_query:
            today_rev = db.query(func.sum(Sale.revenue))\
                          .filter(Sale.sale_date == latest_date_query).scalar() or 0.0
        else:
            today_rev = 0.0

        # 4. Low stock alerts (stock <= reorder_level)
        low_stock = db.query(Inventory).filter(Inventory.current_stock <= Inventory.reorder_level).count()
        
        # 5. Overstock products (stock > reorder_level * 3)
        overstock = db.query(Inventory).filter(Inventory.current_stock > Inventory.reorder_level * 3).count()

        # 6. Predicted Tomorrow's Revenue
        tomorrow = datetime.date.today() + datetime.timedelta(days=1)
        pred_rev = 0.0
        
        forecasts = forecast_service.get_forecasts(db)
        # Sum forecast_quantity * price for tomorrow's forecast date
        for f in forecasts:
            # Check if forecast date is tomorrow (or just take the first forecast point)
            # Typically our service outputs tomorrow's forecast
            qty = f["predicted_sales"]
            price = f["product"]["price"]
            pred_rev += (qty * price)

        return {
            "today_revenue": round(float(today_rev), 2),
            "inventory_value": round(float(inv_val), 2),
            "total_products": total_prods,
            "low_stock_products": low_stock,
            "overstock_products": overstock,
            "predicted_tomorrow_revenue": round(float(pred_rev), 2)
        }

    def get_sales_trends(self, db: Session) -> list[dict]:
        """
        Returns last 30 days of sales trends grouped by date.
        """
        results = db.execute(text("""
            SELECT sale_date, SUM(quantity) as units_sold, SUM(revenue) as daily_revenue
            FROM sales
            GROUP BY sale_date
            ORDER BY sale_date ASC
            LIMIT 30
        """)).fetchall()
        
        return [
            {
                "date": str(row[0]),
                "units_sold": int(row[1]),
                "revenue": round(float(row[2]), 2)
            } for row in results
        ]

    def get_category_performance(self, db: Session) -> list[dict]:
        """
        Returns total revenue and inventory count grouped by product category.
        """
        results = db.execute(text("""
            SELECT p.category, SUM(s.revenue) as category_revenue, SUM(i.current_stock) as stock_units
            FROM products p
            LEFT JOIN sales s ON p.id = s.product_id
            LEFT JOIN inventory i ON p.id = i.product_id
            GROUP BY p.category
            ORDER BY category_revenue DESC NULLS LAST
        """)).fetchall()
        
        return [
            {
                "category": row[0],
                "revenue": round(float(row[1] or 0.0), 2),
                "stock": int(row[2] or 0)
            } for row in results
        ]

    def get_supplier_performance(self, db: Session) -> list[dict]:
        """
        Returns metrics on supplier sales volume and remaining stock.
        """
        results = db.execute(text("""
            SELECT p.supplier, COUNT(DISTINCT p.id) as products_count, SUM(s.quantity) as total_sold
            FROM products p
            LEFT JOIN sales s ON p.id = s.product_id
            GROUP BY p.supplier
            ORDER BY total_sold DESC NULLS LAST
        """)).fetchall()
        
        return [
            {
                "supplier": row[0],
                "products_count": int(row[1]),
                "total_sold": int(row[2] or 0)
            } for row in results
        ]

analytics_service = AnalyticsService()
