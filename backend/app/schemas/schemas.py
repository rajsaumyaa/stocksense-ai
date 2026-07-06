import datetime
from pydantic import BaseModel, EmailStr, Field
from typing import List, Optional

# Token Schemas
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

# User Schemas
class UserBase(BaseModel):
    email: EmailStr
    name: str

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: int
    
    class Config:
        from_attributes = True

# Product Schemas
class ProductBase(BaseModel):
    sku: str
    product_name: str
    category: str
    supplier: str
    price: float

class ProductCreate(ProductBase):
    pass

class ProductResponse(ProductBase):
    id: int
    
    class Config:
        from_attributes = True

# Inventory Schemas
class InventoryBase(BaseModel):
    current_stock: int
    reorder_level: int
    warehouse: str

class InventoryCreate(InventoryBase):
    product_id: int

class InventoryResponse(InventoryBase):
    id: int
    product_id: int
    product: Optional[ProductResponse] = None
    
    class Config:
        from_attributes = True

# Sales Schemas
class SaleBase(BaseModel):
    quantity: int
    sale_date: datetime.date
    revenue: float

class SaleCreate(SaleBase):
    product_id: int

class SaleResponse(SaleBase):
    id: int
    product_id: int
    product: Optional[ProductResponse] = None
    
    class Config:
        from_attributes = True

# Forecast Schemas
class ForecastBase(BaseModel):
    predicted_sales: float
    forecast_date: datetime.date
    stockout_probability: float

class ForecastResponse(ForecastBase):
    id: int
    product_id: int
    product: Optional[ProductResponse] = None
    
    class Config:
        from_attributes = True

# Recommendation Schemas
class RecommendationBase(BaseModel):
    recommendation: str
    confidence: float
    generated_at: datetime.datetime

class RecommendationResponse(RecommendationBase):
    id: int
    product_id: int
    product: Optional[ProductResponse] = None
    
    class Config:
        from_attributes = True

# Dashboard Metrics
class DashboardKPICard(BaseModel):
    title: str
    value: float
    change_pct: float
    type: str  # "currency", "number", "percentage"

class DashboardMetrics(BaseModel):
    today_revenue: float
    inventory_value: float
    total_products: int
    low_stock_products: int
    overstock_products: int
    predicted_tomorrow_revenue: float

# Chat Schemas
class ChatMessage(BaseModel):
    role: str  # "user" or "assistant"
    content: str

class ChatRequest(BaseModel):
    message: str
    history: List[ChatMessage] = []

class ChatResponse(BaseModel):
    response: str
    suggested_prompts: List[str]

# Simulation Schemas
class SimulationInput(BaseModel):
    product_id: int
    reorder_quantity: int
    # Optional parameters to override defaults
    holding_cost_override: Optional[float] = None
    unit_cost_override: Optional[float] = None
    selling_price_override: Optional[float] = None
    lead_time_override: Optional[int] = None

class ScenarioMetrics(BaseModel):
    reorder_quantity: int
    expected_revenue: float
    expected_profit: float
    holding_cost: float
    inventory_remaining: int
    stockout_probability: float
    overstock_risk: float
    days_until_exhaustion: float
    expected_lost_sales: int

class SimulationResponse(BaseModel):
    product_id: int
    product_name: str
    sku: str
    current_inventory: int
    predicted_demand: int
    decision_score: int
    decision_status: str
    scenario_a: ScenarioMetrics  # AI Recommended
    scenario_b: ScenarioMetrics  # Manager Selected
    explanation: str
    net_profit_diff: float
    net_revenue_diff: float
