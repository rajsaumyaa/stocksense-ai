from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db, Product, Inventory, Forecast
from app.schemas import SimulationInput, SimulationResponse, ScenarioMetrics
from app.utils.simulator_logic import calculate_scenario_metrics, calculate_decision_score
from app.services.forecast_service import forecast_service
from app.services.gemini_service import gemini_service

router = APIRouter(prefix="", tags=["Decision Impact Simulator"])

@router.post("/simulate", response_model=SimulationResponse)
def run_simulation(input_data: SimulationInput, db: Session = Depends(get_db)):
    """
    Simulates inventory ordering decisions.
    Recalculates KPIs for Scenario A (AI Recommended) and Scenario B (Manager Selected)
    and queries Gemini (or offline rules) to explain the decision impact.
    """
    # 1. Fetch Product
    prod = db.query(Product).filter(Product.id == input_data.product_id).first()
    if not prod:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )
        
    # 2. Fetch Inventory
    inv = db.query(Inventory).filter(Inventory.product_id == prod.id).first()
    current_inventory = inv.current_stock if inv else 0
    reorder_level = inv.reorder_level if inv else 10
    
    # 3. Get Forecast
    forecasts = forecast_service.get_forecasts(db)
    prod_forecast = next((f for f in forecasts if f["product_id"] == prod.id), None)
    
    # Daily forecast sales
    daily_forecast = prod_forecast["predicted_sales"] if prod_forecast else 15.0
    predicted_demand = int(daily_forecast * 30) # 30-day horizon
    
    # 4. Set lead times and default cost metrics
    lead_time_days = input_data.lead_time_override
    if lead_time_days is None:
        # Default based on supplier
        lead_time_days = 12 if ("Global" in prod.supplier or "Imports" in prod.supplier) else 5
        
    selling_price = input_data.selling_price_override or prod.price
    unit_cost = input_data.unit_cost_override or round(selling_price * 0.5, 2)
    holding_cost = input_data.holding_cost_override or round(unit_cost * 0.05, 2)

    # 5. Compute AI Recommended Quantity
    # Same formula as recommendation service: Cover 30 days + safety stock
    safety_stock = int(daily_forecast * 3) # 3 days safety stock
    ai_rec_qty = int(max(0, predicted_demand - current_inventory + safety_stock))
    if current_inventory > predicted_demand * 1.5:
        ai_rec_qty = 0 # No order needed

    # 6. Calculate Scenario A (AI Recommended)
    metrics_a = calculate_scenario_metrics(
        current_inventory=current_inventory,
        predicted_demand=predicted_demand,
        reorder_quantity=ai_rec_qty,
        selling_price=selling_price,
        unit_cost=unit_cost,
        holding_cost=holding_cost,
        lead_time_days=lead_time_days
    )
    
    # 7. Calculate Scenario B (Manager Selected)
    metrics_b = calculate_scenario_metrics(
        current_inventory=current_inventory,
        predicted_demand=predicted_demand,
        reorder_quantity=input_data.reorder_quantity,
        selling_price=selling_price,
        unit_cost=unit_cost,
        holding_cost=holding_cost,
        lead_time_days=lead_time_days
    )

    # 8. Compute Decision Score for Scenario B
    daily_sales_rate = daily_forecast
    score, status_text = calculate_decision_score(
        scenario=metrics_b,
        predicted_demand=predicted_demand,
        current_inventory=current_inventory,
        lead_time_days=lead_time_days,
        daily_sales_rate=daily_sales_rate
    )

    # 9. Get Gemini Explanation
    explanation = gemini_service.explain_simulation(
        product_name=prod.product_name,
        current_inventory=current_inventory,
        predicted_demand=predicted_demand,
        rec_qty=ai_rec_qty,
        sel_qty=input_data.reorder_quantity,
        metrics_a=metrics_a,
        metrics_b=metrics_b,
        selling_price=selling_price,
        unit_cost=unit_cost
    )

    net_profit_diff = round(metrics_b["expected_profit"] - metrics_a["expected_profit"], 2)
    net_revenue_diff = round(metrics_b["expected_revenue"] - metrics_a["expected_revenue"], 2)

    return SimulationResponse(
        product_id=prod.id,
        product_name=prod.product_name,
        sku=prod.sku,
        current_inventory=current_inventory,
        predicted_demand=predicted_demand,
        decision_score=score,
        decision_status=status_text,
        scenario_a=ScenarioMetrics(**metrics_a),
        scenario_b=ScenarioMetrics(**metrics_b),
        explanation=explanation,
        net_profit_diff=net_profit_diff,
        net_revenue_diff=net_revenue_diff
    )
