import os
# pyrefly: ignore [missing-import]
from sqlalchemy.orm import Session
# pyrefly: ignore [missing-import]
from sqlalchemy import text
from app.config import settings
from app.database import Product, Inventory, Sale, Forecast, Recommendation

class GeminiService:
    def __init__(self):
        self.api_key = settings.GEMINI_API_KEY
        self.client = None
        
        if self.api_key:
            try:
                # pyrefly: ignore [missing-import]
                from google import genai
                self.client = genai.Client(api_key=self.api_key)
                print("[Gemini] Client successfully initialized.")
            except Exception as e:
                print(f"[Gemini] Failed to initialize Google GenAI SDK: {e}. Using offline generator.")
        else:
            print("[Gemini] GEMINI_API_KEY not found. Using offline generator fallback.")

    def get_database_context(self, db: Session) -> str:
        """
        Retrieves real-time inventory statistics, low-stock products, overstock products,
        and demand forecast summaries to construct the RAG context.
        """
        try:
            # 1. Total products and value
            total_products = db.query(Product).count()
            
            # 2. Low stock count
            low_stock_count = db.query(Inventory).filter(Inventory.current_stock <= Inventory.reorder_level).count()
            
            # 3. Overstock count (stock > reorder_level * 3)
            overstock_count = db.query(Inventory).filter(Inventory.current_stock > Inventory.reorder_level * 3).count()
            
            # 4. Low stock products details
            low_stock_items = db.query(Product, Inventory).join(Inventory).filter(Inventory.current_stock <= Inventory.reorder_level).limit(5).all()
            low_stock_str = ", ".join([f"{p.product_name} (SKU: {p.sku}, Stock: {i.current_stock}/{i.reorder_level})" for p, i in low_stock_items])
            
            # 5. Top selling products
            top_sales = db.execute(text("""
                SELECT p.product_name, SUM(s.quantity) as qty 
                FROM sales s 
                JOIN products p ON s.product_id = p.id 
                GROUP BY p.product_name 
                ORDER BY qty DESC 
                LIMIT 3
            """)).fetchall()
            top_sales_str = ", ".join([f"{row[0]} ({row[1]} units)" for row in top_sales])
            
            # 6. High risk forecasts
            high_risk_forecasts = db.query(Product, Forecast).join(Forecast).filter(Forecast.stockout_probability > 0.6).limit(5).all()
            high_risk_str = ", ".join([f"{p.product_name} (Stockout Prob: {int(f.stockout_probability*100)}%)" for p, f in high_risk_forecasts])

            context = (
                f"SYSTEM INVENTORY STATE CONTEXT:\n"
                f"- Total Products Tracked: {total_products}\n"
                f"- Low Stock Alert Products: {low_stock_count} (Top items: {low_stock_str if low_stock_str else 'None'})\n"
                f"- Overstock Risk Products: {overstock_count}\n"
                f"- Top Selling Products (historical): {top_sales_str if top_sales_str else 'None'}\n"
                f"- Products with High Stockout Probability: {high_risk_str if high_risk_str else 'None'}\n"
            )
            return context
        except Exception as e:
            return f"Error retrieving database context: {str(e)}"

    def chat_assistant(self, user_message: str, history: list, db: Session) -> str:
        """
        Handles chatbot prompts using RAG. If Gemini client is unavailable,
        interprets the query using a data-aware keyword-matching system.
        """
        db_context = self.get_database_context(db)
        
        # Build prompt
        prompt = (
            f"You are StockSense AI, a professional Decision Intelligence Assistant for retail store managers.\n"
            f"Use the following real-time database context to help answer the user's question accurately.\n"
            f"Be concise, actionable, and focus on inventory economics (revenue, holding costs, lost sales).\n\n"
            f"{db_context}\n"
            f"User Question: {user_message}\n"
            f"Assistant:"
        )

        if self.client:
            try:
                # Structure message history
                contents = []
                for msg in history[-6:]: # Include last 6 messages
                    contents.append(f"{msg['role'].upper()}: {msg['content']}")
                contents.append(prompt)
                
                response = self.client.models.generate_content(
                    model="gemini-2.5-flash",
                    contents="\n".join(contents)
                )
                return response.text
            except Exception as e:
                print(f"[Gemini] API error: {e}. Falling back to offline responses.")

        # Offline Fallback (RAG keyword matching)
        user_message_lower = user_message.lower()
        
        # 1. Restocking
        if any(w in user_message_lower for w in ["reorder", "restock", "buy", "order", "tomorrow"]):
            low_stock_items = db.query(Product, Inventory).join(Inventory).filter(Inventory.current_stock <= Inventory.reorder_level).all()
            if not low_stock_items:
                return (
                    "### StockSense AI Assistant (Offline Mode)\n\n"
                    "Good news! Currently, **no products** are below their reorder levels. "
                    "Your inventory is fully stocked to meet near-term demand."
                )
            
            res = "### StockSense AI Recommendation Summary\n\nBased on current stock and forecast data, the following items should be reordered tomorrow:\n\n"
            res += "| Product | SKU | Stock / Reorder | Warehouse |\n"
            res += "| :--- | :--- | :--- | :--- |\n"
            for p, i in low_stock_items:
                res += f"| **{p.product_name}** | {p.sku} | {i.current_stock} / {i.reorder_level} units | {i.warehouse} |\n"
            
            res += "\n*Go to the **Recommendations** page to see details about suggested order quantities and financial impacts.*"
            return res

        # 2. Why is demand increasing / Sales trends
        elif any(w in user_message_lower for w in ["demand", "increasing", "sales", "trend", "popular"]):
            top_sales = db.execute(text("""
                SELECT p.product_name, p.category, SUM(s.quantity) as qty, SUM(s.revenue) as rev 
                FROM sales s 
                JOIN products p ON s.product_id = p.id 
                GROUP BY p.product_name, p.category 
                ORDER BY qty DESC 
                LIMIT 5
            """)).fetchall()
            
            if not top_sales:
                return "### StockSense AI Assistant (Offline Mode)\n\nNo historical sales records found in the database. Please upload a CSV first."
                
            res = "### Demand and Sales Analytics\n\nBased on your historical sales patterns, the top-performing products are:\n\n"
            res += "| Product | Category | Units Sold | Total Revenue |\n"
            res += "| :--- | :--- | :--- | :--- |\n"
            for row in top_sales:
                res += f"| **{row[0]}** | {row[1]} | {row[2]} units | ${row[3]:,.2f} |\n"
            
            res += "\nDemand is typically driven by weekday seasonality (grocery items peak Friday-Saturday) and product promotional campaigns."
            return res

        # 3. Stockout Risk
        elif any(w in user_message_lower for w in ["stockout", "risk", "run out"]):
            high_risk = db.query(Product, Forecast).join(Forecast).filter(Forecast.stockout_probability > 0.5).all()
            if not high_risk:
                return "### Stockout Risk Analysis\n\nNo products currently show a stockout risk exceeding 50%. Your safety buffers are sufficient."
                
            res = "### High Stockout Risk Warning\n\nThe following products have high predicted stockout probability due to low inventory and strong tomorrow demand:\n\n"
            res += "| Product | SKU | Stockout Probability | Forecast Demand |\n"
            res += "| :--- | :--- | :--- | :--- |\n"
            for p, f in high_risk:
                res += f"| **{p.product_name}** | {p.sku} | **{int(f.stockout_probability * 100)}%** | {f.predicted_sales} units |\n"
            
            res += "\n*Action Required*: Please visit the **Decision Simulator** to evaluate reorder sizes for these items to avoid stockouts."
            return res

        # 4. Overstock
        elif any(w in user_message_lower for w in ["overstock", "excess", "reduce", "surplus"]):
            overstock_items = db.query(Product, Inventory).join(Inventory).filter(Inventory.current_stock > Inventory.reorder_level * 3).all()
            if not overstock_items:
                return "### Overstock Analysis\n\nNo overstock situations detected. Inventory turnover is operating within target parameters."
                
            res = "### Overstock Reduction Strategy\n\nThe following items have excess stocks relative to reorder thresholds, resulting in high holding costs:\n\n"
            res += "| Product | Current Stock | Reorder Level | Warehouse |\n"
            res += "| :--- | :--- | :--- | :--- |\n"
            for p, i in overstock_items:
                res += f"| **{p.product_name}** | {i.current_stock} units | {i.reorder_level} units | {i.warehouse} |\n"
            
            res += "\n**Recommended actions to reduce holding costs:**\n" \
                   "1. Bundle slow-moving products with top sellers.\n" \
                   "2. Introduce temporary category discounts (10% to 15%).\n" \
                   "3. Negotiate vendor-managed inventory return agreements."
            return res

        # Default Summary
        total_products = db.query(Product).count()
        low_stock_count = db.query(Inventory).filter(Inventory.current_stock <= Inventory.reorder_level).count()
        overstock_count = db.query(Inventory).filter(Inventory.current_stock > Inventory.reorder_level * 3).count()
        
        return (
            f"### Welcome to StockSense AI Assistant (Offline Mode)\n\n"
            f"I am running in offline mode because the Gemini API Key is not set or configured, but I still have access to your live data!\n\n"
            f"**Current Store Inventory Overview:**\n"
            f"- **{total_products}** active products registered.\n"
            f"- **{low_stock_count}** products are at or below reorder levels (high stockout risk).\n"
            f"- **{overstock_count}** products have surplus stock (excess holding cost).\n\n"
            f"**Suggested Questions you can ask:**\n"
            f"- *Which products should I reorder tomorrow?*\n"
            f"- *Show products with the highest stockout risk.*\n"
            f"- *How can I reduce overstock?*\n"
            f"- *Why is milk demand increasing?*"
        )

    def explain_simulation(
        self,
        product_name: str,
        current_inventory: int,
        predicted_demand: int,
        rec_qty: int,
        sel_qty: int,
        metrics_a: dict,
        metrics_b: dict,
        selling_price: float,
        unit_cost: float
    ) -> str:
        """
        Calls Gemini to explain the business implications of a manager's order quantity
        compared to the AI recommendation. Falls back to a dynamic rules-based analysis if offline.
        """
        prompt = (
            f"Explain the inventory decision trade-off for '{product_name}'.\n"
            f"Product Price: ${selling_price}, Unit Cost: ${unit_cost}\n"
            f"Current Stock: {current_inventory} units, Predicted Demand (30-day): {predicted_demand} units.\n"
            f"Scenario A (AI Recommended Order): Quantity = {rec_qty} units\n"
            f"  - Expected Revenue: ${metrics_a['expected_revenue']}\n"
            f"  - Expected Profit: ${metrics_a['expected_profit']}\n"
            f"  - Holding Cost: ${metrics_a['holding_cost']}\n"
            f"  - Stockout Risk: {int(metrics_a['stockout_probability']*100)}%\n"
            f"  - Lost Sales: {metrics_a['expected_lost_sales']} units\n"
            f"Scenario B (Manager Selected Order): Quantity = {sel_qty} units\n"
            f"  - Expected Revenue: ${metrics_b['expected_revenue']}\n"
            f"  - Expected Profit: ${metrics_b['expected_profit']}\n"
            f"  - Holding Cost: ${metrics_b['holding_cost']}\n"
            f"  - Stockout Risk: {int(metrics_b['stockout_probability']*100)}%\n"
            f"  - Lost Sales: {metrics_b['expected_lost_sales']} units\n\n"
            f"Write a 3-4 sentence professional business analysis explaining which option is better, the trade-off in holding costs vs stockout revenue, and the overall net impact."
        )

        if self.client:
            try:
                response = self.client.models.generate_content(
                    model="gemini-2.5-flash",
                    contents=prompt
                )
                return response.text
            except Exception as e:
                print(f"[Gemini] Explanation API error: {e}. Running local generator.")

        # Local Rules-based Explanation Generator
        diff_qty = sel_qty - rec_qty
        profit_diff = metrics_b['expected_profit'] - metrics_a['expected_profit']
        
        if diff_qty == 0:
            return (
                f"You have selected the AI Recommended quantity of **{rec_qty} units** for {product_name}. "
                f"This decision strikes an optimal balance, providing a low stockout probability ({int(metrics_a['stockout_probability']*100)}%) "
                f"while keeping monthly holding costs minimized at ${metrics_a['holding_cost']:.2f}. "
                f"It maximizes expected cash-flow profit to ${metrics_a['expected_profit']:.2f}."
            )
            
        elif diff_qty < 0:
            # Manager ordered LESS than AI
            holding_saving = metrics_a['holding_cost'] - metrics_b['holding_cost']
            revenue_lost = metrics_a['expected_revenue'] - metrics_b['expected_revenue']
            
            explanation = (
                f"By ordering **{sel_qty} units** (which is {abs(diff_qty)} units *less* than the AI recommendation), "
                f"you reduce your order capital layout and lower monthly holding costs by **${holding_saving:.2f}**. "
            )
            
            if metrics_b['stockout_probability'] > metrics_a['stockout_probability']:
                explanation += (
                    f"However, this increases your stockout probability to **{int(metrics_b['stockout_probability']*100)}%** "
                    f"and risks **{metrics_b['expected_lost_sales']} units** in lost sales (costing **${revenue_lost:.2f}** in expected revenue). "
                )
            
            if profit_diff < 0:
                explanation += (
                    f"Overall, this under-ordering decreases expected net profit by **${abs(profit_diff):.2f}** compared to the AI plan. "
                    f"We advise increasing the order size closer to {rec_qty} units to protect sales velocity."
                )
            else:
                explanation += (
                    f"Surprisingly, this yields a positive cash-flow variance of **${profit_diff:.2f}** due to lower purchasing costs, "
                    f"making it a viable defensive cash-preservation strategy if capital is constrained."
                )
            return explanation
            
        else:
            # Manager ordered MORE than AI
            holding_cost_increase = metrics_b['holding_cost'] - metrics_a['holding_cost']
            purchase_increase = (sel_qty - rec_qty) * unit_cost
            
            explanation = (
                f"By ordering **{sel_qty} units** ({diff_qty} units *more* than the AI recommendation), "
                f"you secure inventory depth but increase your capital outlay by **${purchase_increase:.2f}** "
                f"and increase monthly holding costs by **${holding_cost_increase:.2f}**. "
            )
            
            if metrics_b['expected_lost_sales'] < metrics_a['expected_lost_sales']:
                recovered_sales = metrics_a['expected_lost_sales'] - metrics_b['expected_lost_sales']
                explanation += f"This additional stock covers safety margins, recovering {recovered_sales} units of potential lost sales. "
            else:
                explanation += f"Since the AI recommendation already covers 100% of demand, these extra units will sit in the warehouse as dead stock. "
                
            if profit_diff < 0:
                explanation += (
                    f"This decision results in a net profit decrease of **${abs(profit_diff):.2f}** due to overstocking costs. "
                    f"We recommend sticking closer to the recommended {rec_qty} units."
                )
            else:
                explanation += (
                    f"This results in a net profit increase of **${profit_diff:.2f}** due to higher sales coverage, "
                    f"representing an aggressive inventory positioning strategy."
                )
            return explanation

gemini_service = GeminiService()
