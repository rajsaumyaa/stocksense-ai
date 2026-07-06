# Google Looker Studio Connection & BI Dashboard Guide

This guide explains how to connect the database views exposed by **StockSense AI** to Google Looker Studio for executive BI reporting, automated stock sheets, and sales dashboards.

---

## 1. Exposed Database Views

StockSense AI automatically provisions three optimized SQL views on startup:

### View 1: `v_sales_trends`
Aggregates sales transactions over time for product and categories.
*   **Columns**:
    *   `sale_date` (Date)
    *   `category` (Text)
    *   `product_name` (Text)
    *   `sku` (Text)
    *   `total_quantity` (Integer)
    *   `total_revenue` (Numeric)
*   **Best Used For**: Category sales breakdown, total revenue scorecards, weekly sales velocity line graphs.

### View 2: `v_inventory_health`
Combines product details with warehouse levels, classifying the stock health.
*   **Columns**:
    *   `product_id` (Integer)
    *   `sku` (Text)
    *   `product_name` (Text)
    *   `category` (Text)
    *   `supplier` (Text)
    *   `current_stock` (Integer)
    *   `reorder_level` (Integer)
    *   `warehouse` (Text)
    *   `stock_status` (`HEALTHY` | `LOW STOCK` | `OVERSTOCK` | `OUT OF STOCK`)
*   **Best Used For**: Stockout risk pie charts, supplier reliability metrics, low stock warning lists.

### View 3: `v_demand_forecast`
Combines predicted future sales from the XGBoost ML model.
*   **Columns**:
    *   `forecast_date` (Date)
    *   `product_name` (Text)
    *   `category` (Text)
    *   `sku` (Text)
    *   `predicted_sales` (Numeric)
    *   `stockout_probability` (Numeric)
*   **Best Used For**: Future demand lines, stock replenishment planners.

---

## 2. Connecting Looker Studio to PostgreSQL

To build live dashboard panels, connect Looker Studio directly to your PostgreSQL database instance:

### Step 1: Open Google Looker Studio
1.  Navigate to [Looker Studio](https://lookerstudio.google.com/).
2.  Click **Create** (top-left) -> **Data Source**.

### Step 2: Select PostgreSQL Connector
1.  Search for **PostgreSQL** in the connector list.
2.  Select the official Google PostgreSQL connector.

### Step 3: Enter Database Credentials
Input the connection details matching your database configuration:
*   **Host Name or IP**: Your database server's IP address (e.g. your Cloud SQL IP, public VPS IP, or `localhost` if tunnelled).
*   **Port**: `5432`
*   **Database**: `stocksense`
*   **Username**: `postgres`
*   **Password**: `postgres` (or your production password)

> [!TIP]
> If your database resides inside a private VPC or Google Cloud SQL, you should enable **Public IP** with authorized networks (including Looker Studio's IP range) or set up a secure Cloud SQL Auth Proxy.

### Step 4: Connect to Views (Custom Query)
Instead of importing raw tables, select **Custom Query** on the left panel. Enter one of the optimized view queries to load structured metrics:

#### Query 1: Historical Sales Analytics
```sql
SELECT * FROM v_sales_trends;
```

#### Query 2: Warehouse Stock Health Status
```sql
SELECT * FROM v_inventory_health;
```

#### Query 3: ML Restocking Predictor
```sql
SELECT * FROM v_demand_forecast;
```

Click **Add** -> **Add to Report** to start building cards.

---

## 3. Recommended Looker Studio Visualizations

| Report Type | Chart Type | Dimension | Metric | Filter / Segment |
| :--- | :--- | :--- | :--- | :--- |
| **Sales Velocity** | Line Chart | `sale_date` | `total_revenue` | Segment by `category` |
| **Stock Status Map** | Pie Chart | `stock_status` | Record Count | Filter for `LOW STOCK` |
| **Supplier Risk** | Bar Chart | `supplier` | `current_stock` | Sort ascending |
| **Future Demand** | Combo Chart | `forecast_date` | `predicted_sales` | Show next 7 days |
