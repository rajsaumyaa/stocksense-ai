import csv
import random
from datetime import datetime, timedelta

def generate_retail_csv():
    # 5 Sample Products
    products = [
        {
            "sku": "ELEC-TV-001",
            "product_name": "Smart LED TV",
            "category": "Electronics",
            "supplier": "Nexus Electronics",
            "price": 499.99,
            "current_stock": 8,       # Low Stock! (Reorder level is 10)
            "reorder_level": 10,
            "warehouse": "WH-NORTH",
            "avg_daily_sales": 1.2
        },
        {
            "sku": "GROC-MILK-002",
            "product_name": "Organic Almond Milk",
            "category": "Groceries",
            "supplier": "Green Fields Agro",
            "price": 4.50,
            "current_stock": 120,     # Healthy stock (Reorder level is 40)
            "reorder_level": 40,
            "warehouse": "WH-WEST",
            "avg_daily_sales": 22.0
        },
        {
            "sku": "APP-JEANS-003",
            "product_name": "Men's Slim Fit Jeans",
            "category": "Apparels",
            "supplier": "Stitch & Loom",
            "price": 39.99,
            "current_stock": 14,      # Low Stock! (Reorder level is 30)
            "reorder_level": 30,
            "warehouse": "WH-SOUTH",
            "avg_daily_sales": 4.5
        },
        {
            "sku": "HOME-CHAIR-004",
            "product_name": "Ergonomic Office Chair",
            "category": "Home Goods",
            "supplier": "Apex Comforts",
            "price": 149.99,
            "current_stock": 42,      # Healthy Stock (Reorder level is 15)
            "reorder_level": 15,
            "warehouse": "WH-EAST",
            "avg_daily_sales": 2.1
        },
        {
            "sku": "BEAU-CREAM-005",
            "product_name": "Anti-Aging Face Cream",
            "category": "Beauty",
            "supplier": "Aura Essentials",
            "price": 29.99,
            "current_stock": 250,     # Overstock! (Reorder level is 20)
            "reorder_level": 20,
            "warehouse": "WH-NORTH",
            "avg_daily_sales": 1.5
        }
    ]

    # Generate 60 days of historical sales transactions
    end_date = datetime.now()
    start_date = end_date - timedelta(days=60)
    
    rows = []
    
    # Header
    header = [
        "sku", "product_name", "category", "supplier", "price",
        "current_stock", "reorder_level", "warehouse",
        "sale_date", "quantity", "revenue"
    ]
    
    current_date = start_date
    while current_date <= end_date:
        date_str = current_date.strftime("%Y-%m-%d")
        day_of_week = current_date.weekday() # 0 = Monday, 6 = Sunday
        
        for prod in products:
            # Sales probability: lower on Mon-Wed, higher on Fri-Sun
            base_sales = prod["avg_daily_sales"]
            
            # Seasonality multiplier
            multiplier = 1.0
            if day_of_week in [4, 5, 6]: # Weekend boost
                multiplier = 1.4
            
            # Occasional random promotions
            if random.random() < 0.05:
                multiplier *= 2.0
                
            # Compute actual quantity sold on this day
            # Use Poisson distribution or random range
            qty_sold = int(random.gauss(base_sales * multiplier, base_sales * 0.2))
            
            # Avoid negative sales
            qty_sold = max(0, qty_sold)
            
            # If average is high (like Almond Milk), we will guarantee sales
            if base_sales > 15 and qty_sold == 0:
                qty_sold = int(base_sales)
                
            # If average is low (like TV), sales will be 0 on many days, 1-2 on others
            if base_sales < 2:
                qty_sold = 1 if random.random() < (base_sales * multiplier / 2) else 0

            # Only append if quantity > 0
            if qty_sold > 0:
                revenue = round(qty_sold * prod["price"], 2)
                rows.append([
                    prod["sku"],
                    prod["product_name"],
                    prod["category"],
                    prod["supplier"],
                    prod["price"],
                    prod["current_stock"],
                    prod["reorder_level"],
                    prod["warehouse"],
                    date_str,
                    qty_sold,
                    revenue
                ])
                
        current_date += timedelta(days=1)
        
    # Write to CSV
    output_path = "backend/data/sample_retail_data.csv"
    with open(output_path, mode="w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(header)
        writer.writerows(rows)
        
    print(f"[Seed] Successfully generated {len(rows)} retail transactions at: {output_path}")

if __name__ == "__main__":
    generate_retail_csv()
