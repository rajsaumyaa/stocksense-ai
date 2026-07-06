import math

def calculate_scenario_metrics(
    current_inventory: int,
    predicted_demand: int,
    reorder_quantity: int,
    selling_price: float,
    unit_cost: float,
    holding_cost: float,
    lead_time_days: int
) -> dict:
    """
    Computes all the KPIs for a single inventory scenario.
    All calculations are based on a 30-day projection window.
    """
    total_stock_available = current_inventory + reorder_quantity
    
    # 30-day sales volume cannot exceed available stock or predicted demand
    sales_quantity = min(total_stock_available, predicted_demand)
    
    expected_revenue = sales_quantity * selling_price
    
    # Financial costs
    purchase_cost = reorder_quantity * unit_cost
    
    # Remaining stock at the end of the month
    remaining_stock = max(0, total_stock_available - predicted_demand)
    
    # Holding cost charged on remaining stock
    total_holding_cost = remaining_stock * holding_cost
    
    # Profit calculation
    # Option A: Sales margin minus holding costs and purchase costs
    # Profit = expected_revenue - purchase_cost - total_holding_cost
    # Option B: Standard accounting gross profit minus holding costs:
    # Gross Profit = sales_quantity * (selling_price - unit_cost) - total_holding_cost.
    # To show realistic order cash flow impact, let's use:
    expected_profit = expected_revenue - purchase_cost - total_holding_cost
    
    # Expected Lost Sales
    expected_lost_sales = max(0, predicted_demand - total_stock_available)
    
    # Days until stock exhaustion
    daily_sales_rate = predicted_demand / 30.0
    if daily_sales_rate > 0:
        days_until_exhaustion = min(90.0, total_stock_available / daily_sales_rate)
    else:
        days_until_exhaustion = 90.0
        
    # Stockout Probability (0.0 to 1.0)
    # If we have less stock than demand, stockout is guaranteed.
    # If we have more than demand but lead time is high, we might run out before delivery.
    if total_stock_available == 0:
        stockout_prob = 1.0
    elif total_stock_available < predicted_demand:
        stockout_prob = 1.0 - (total_stock_available / (predicted_demand * 1.1))
        stockout_prob = max(0.2, min(1.0, stockout_prob))
    else:
        # Stock is sufficient for demand. Stockout probability depends on lead time and safety buffer.
        safety_buffer = total_stock_available - predicted_demand
        ideal_safety_buffer = daily_sales_rate * lead_time_days
        
        if safety_buffer >= ideal_safety_buffer:
            stockout_prob = 0.02 # Extremely low
        else:
            # Buffer is smaller than lead time demand
            ratio = safety_buffer / (ideal_safety_buffer + 1e-5)
            stockout_prob = 0.3 * (1.0 - ratio)
            stockout_prob = max(0.02, min(0.3, stockout_prob))

    # Overstock Risk (0.0 to 1.0)
    # If stock is more than 1.5x of demand, overstock risk grows.
    if total_stock_available <= predicted_demand:
        overstock_risk = 0.0
    else:
        excess_ratio = (total_stock_available - predicted_demand) / (predicted_demand + 1e-5)
        overstock_risk = min(1.0, excess_ratio / 1.0) # 100% overstock risk if we have 2x demand

    return {
        "reorder_quantity": reorder_quantity,
        "expected_revenue": round(expected_revenue, 2),
        "expected_profit": round(expected_profit, 2),
        "holding_cost": round(total_holding_cost, 2),
        "inventory_remaining": int(remaining_stock),
        "stockout_probability": round(stockout_prob, 2),
        "overstock_risk": round(overstock_risk, 2),
        "days_until_exhaustion": round(days_until_exhaustion, 1),
        "expected_lost_sales": int(expected_lost_sales)
    }

def calculate_decision_score(
    scenario: dict,
    predicted_demand: int,
    current_inventory: int,
    lead_time_days: int,
    daily_sales_rate: float
) -> tuple[int, str]:
    """
    Computes an AI Decision Score (0 to 100) and returns a human-readable status.
    """
    score = 100
    
    # Deduct points for stockouts
    stockout_prob = scenario["stockout_probability"]
    if stockout_prob > 0.8:
        score -= 45
    elif stockout_prob > 0.5:
        score -= 30
    elif stockout_prob > 0.2:
        score -= 15
    elif stockout_prob > 0.05:
        score -= 5
        
    # Deduct points for excessive lost sales
    lost_sales_pct = scenario["expected_lost_sales"] / (predicted_demand + 1e-5)
    if lost_sales_pct > 0.5:
        score -= 20
    elif lost_sales_pct > 0.2:
        score -= 10
        
    # Deduct points for overstock
    overstock_risk = scenario["overstock_risk"]
    if overstock_risk > 0.8:
        score -= 35
    elif overstock_risk > 0.5:
        score -= 20
    elif overstock_risk > 0.2:
        score -= 10
        
    # Deduct points for negative profit
    if scenario["expected_profit"] < 0:
        score -= 25
        
    # Reward matching ideal inventory level
    # Ideal total inventory = Demand + safety stock (lead time demand)
    ideal_total_stock = predicted_demand + math.ceil(daily_sales_rate * lead_time_days)
    actual_total_stock = current_inventory + scenario["reorder_quantity"]
    
    deviation = abs(actual_total_stock - ideal_total_stock) / (ideal_total_stock + 1e-5)
    if deviation < 0.05:
        score += 5 # bonus for perfect ordering
        
    # Clamp score
    score = max(0, min(100, score))
    
    # Status
    if score >= 90:
        status = "Excellent Inventory Decision"
    elif score >= 75:
        status = "Good Inventory Decision"
    elif score >= 55:
        status = "Moderate Risk Decision"
    elif score >= 35:
        status = "High Risk Decision"
    else:
        status = "Critical Risk Decision"
        
    return score, status
