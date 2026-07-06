import datetime
from sqlalchemy.orm import Session
from app.database import Product, Inventory, Sale, Forecast, Recommendation
from app.services.forecast_service import forecast_service

class RecommendationService:
    def generate_recommendations(self, db: Session) -> list[dict]:
        """
        Runs decision intelligence logic rules on current stocks and forecasts
        to generate actionable recommendations.
        """
        # Fetch forecasts
        forecast_list = forecast_service.get_forecasts(db)
        if not forecast_list:
            return []
            
        # Group forecasts by product_id (taking tomorrow's forecast as baseline daily forecast)
        prod_forecasts = {}
        for f in forecast_list:
            pid = f["product_id"]
            if pid not in prod_forecasts:
                prod_forecasts[pid] = f

        # Create/overwrite recommendations table records
        db.query(Recommendation).delete()
        
        results = []
        for pid, f in prod_forecasts.items():
            prod = db.query(Product).filter(Product.id == pid).first()
            inv = db.query(Inventory).filter(Inventory.product_id == pid).first()
            if not prod or not inv:
                continue

            current_stock = inv.current_stock
            reorder_level = inv.reorder_level
            
            # Predict 30-day demand
            daily_forecast = f["predicted_sales"]
            forecast_30_day = round(daily_forecast * 30, 1)
            
            # Dynamic Lead Time based on supplier names (for demo variance)
            lead_time_days = 5
            if "Global" in prod.supplier or "Imports" in prod.supplier:
                lead_time_days = 12
            elif "Local" in prod.supplier or "Express" in prod.supplier:
                lead_time_days = 2
            
            rec_text = ""
            rec_qty = 0
            priority = "LOW"
            revenue_impact = 0.0
            risk_type = "Healthy"
            confidence = f.get("confidence", 80) / 100.0

            # Rule 1: High stockout risk (Current Stock is less than reorder level or 5 days of forecast)
            needed_stock_lead_time = daily_forecast * lead_time_days
            
            if current_stock <= reorder_level or current_stock < needed_stock_lead_time:
                # Stockout risk is high!
                risk_type = "Stockout Risk"
                priority = "HIGH" if current_stock <= (needed_stock_lead_time * 0.5) else "MEDIUM"
                
                # Recommended quantity: bring stock to cover 30 days of sales + safety stock
                safety_stock = int(daily_forecast * 3) # 3 days safety stock
                rec_qty = int(max(10, forecast_30_day - current_stock + safety_stock))
                
                # Lost sales if we don't restock:
                expected_lost_qty = max(0.0, forecast_30_day - current_stock)
                revenue_impact = round(expected_lost_qty * prod.price, 2)
                
                rec_text = f"Restock urgently! Current stock ({current_stock} units) is below reorder level ({reorder_level} units). Order {rec_qty} units to cover 30-day demand and safety buffer."

            # Rule 2: Overstock risk (Current Stock is more than 45 days of sales)
            elif current_stock > (daily_forecast * 45):
                risk_type = "Overstock Risk"
                priority = "LOW"
                rec_qty = 0
                
                # Revenue impact of holding cost:
                excess_units = current_stock - (daily_forecast * 30)
                holding_cost_est = excess_units * (prod.price * 0.05) # Assume 5% of unit price monthly holding cost
                revenue_impact = -round(holding_cost_est, 2) # Negative indicates cost savings if reduced
                
                rec_text = f"Overstock detected. Current inventory ({current_stock} units) covers over 45 days of demand. Run a promotion or discount to reduce holding costs by ${abs(revenue_impact)}."

            # Rule 3: Lead time buffer early purchase (Stock is okay for now, but lead time is high and stock is approaching reorder level)
            elif lead_time_days >= 10 and current_stock < (needed_stock_lead_time * 1.5):
                risk_type = "Lead Time Warning"
                priority = "MEDIUM"
                rec_qty = int(max(10, forecast_30_day - current_stock))
                revenue_impact = round((forecast_30_day - current_stock) * prod.price * 0.3, 2) # Proportional impact
                rec_text = f"Early purchase recommended due to long supplier lead time ({lead_time_days} days). Order {rec_qty} units now to prevent mid-month stockout."

            # Rule 4: Healthy
            else:
                risk_type = "Healthy"
                priority = "LOW"
                rec_qty = 0
                revenue_impact = 0.0
                rec_text = f"Stock level healthy ({current_stock} units). No immediate restock needed."

            # Insert into database
            db_rec = Recommendation(
                product_id=prod.id,
                recommendation=rec_text,
                confidence=confidence,
                generated_at=datetime.datetime.utcnow()
            )
            db.add(db_rec)
            
            results.append({
                "product_id": prod.id,
                "sku": prod.sku,
                "product_name": prod.product_name,
                "category": prod.category,
                "price": prod.price,
                "current_stock": current_stock,
                "predicted_demand": forecast_30_day,
                "reorder_quantity": rec_qty,
                "priority": priority,
                "revenue_impact": revenue_impact,
                "risk_type": risk_type,
                "recommendation": rec_text,
                "confidence": int(confidence * 100),
                "supplier": prod.supplier,
                "warehouse": inv.warehouse,
                "lead_time_days": lead_time_days
            })

        db.commit()
        return results

recommendation_service = RecommendationService()
