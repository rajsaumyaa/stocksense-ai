export interface Product {
  id: number;
  sku: string;
  product_name: string;
  category: string;
  supplier: string;
  price: number;
}

export interface InventoryItem {
  id: number;
  product_id: number;
  product_name: string;
  sku: string;
  category: string;
  supplier: string;
  price: number;
  current_stock: number;
  reorder_level: number;
  warehouse: string;
  status: 'LOW STOCK' | 'OVERSTOCK' | 'HEALTHY';
}

export interface SaleItem {
  id: number;
  product_id: number;
  product_name: string;
  sku: string;
  quantity: number;
  sale_date: string;
  revenue: number;
}

export interface ForecastItem {
  id: number;
  product_id: number;
  product: {
    id: number;
    sku: string;
    product_name: string;
    category: string;
    supplier: string;
    price: number;
  };
  predicted_sales: number;
  forecast_date: string;
  stockout_probability: number;
  confidence: number;
}

export interface RecommendationItem {
  product_id: number;
  sku: string;
  product_name: string;
  category: string;
  price: number;
  current_stock: number;
  predicted_demand: number;
  reorder_quantity: number;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  revenue_impact: number;
  risk_type: string;
  recommendation: string;
  confidence: number;
  supplier: string;
  warehouse: string;
  lead_time_days: number;
}

export interface DashboardKPICard {
  title: string;
  value: number;
  change_pct: number;
  type: 'currency' | 'number' | 'percentage';
}

export interface DashboardKPIs {
  today_revenue: number;
  inventory_value: number;
  total_products: number;
  low_stock_products: number;
  overstock_products: number;
  predicted_tomorrow_revenue: number;
}

export interface SalesTrendPoint {
  date: string;
  units_sold: number;
  revenue: number;
}

export interface CategoryBreakdownPoint {
  category: string;
  revenue: number;
  stock: number;
}

export interface SupplierPerformancePoint {
  supplier: string;
  products_count: number;
  total_sold: number;
}

export interface DashboardData {
  kpis: DashboardKPIs;
  sales_trends: SalesTrendPoint[];
  category_breakdown: CategoryBreakdownPoint[];
  supplier_performance: SupplierPerformancePoint[];
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ScenarioMetrics {
  reorder_quantity: number;
  expected_revenue: number;
  expected_profit: number;
  holding_cost: number;
  inventory_remaining: number;
  stockout_probability: number;
  overstock_risk: number;
  days_until_exhaustion: number;
  expected_lost_sales: number;
}

export interface SimulationResponse {
  product_id: number;
  product_name: string;
  sku: string;
  current_inventory: number;
  predicted_demand: number;
  decision_score: number;
  decision_status: string;
  scenario_a: ScenarioMetrics;
  scenario_b: ScenarioMetrics;
  explanation: string;
  net_profit_diff: number;
  net_revenue_diff: number;
}
