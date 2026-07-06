import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../services/api';
import type { SimulationResponse } from '../types';
import GlassCard from '../components/GlassCard';
import DecisionScoreGauge from '../components/DecisionScoreGauge';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { 
  Sparkles, 
  Sliders, 
  TrendingUp, 
  Package, 
  DollarSign, 
  AlertTriangle,
  ArrowRight,
  TrendingDown,
  Info
} from 'lucide-react';

export const DecisionSimulator: React.FC = () => {
  const [searchParams] = useSearchParams();
  const productIdParam = searchParams.get('productId');
  const qtyParam = searchParams.get('qty');

  const [products, setProducts] = useState<any[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  
  // Simulation Inputs
  const [reorderQuantity, setReorderQuantity] = useState<number>(0);
  
  // Custom Overrides
  const [holdingCostOverride, setHoldingCostOverride] = useState<string>('');
  const [unitCostOverride, setUnitCostOverride] = useState<string>('');
  const [sellingPriceOverride, setSellingPriceOverride] = useState<string>('');
  const [leadTimeOverride, setLeadTimeOverride] = useState<string>('');

  // Simulation Outputs
  const [simulation, setSimulation] = useState<SimulationResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch all products first to populate the selector dropdown
  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const data = await api.getProducts();
      setProducts(data);
      
      // Determine initial product selection
      if (data.length > 0) {
        let initialId = data[0].id;
        if (productIdParam) {
          const parsed = parseInt(productIdParam, 10);
          if (data.some(p => p.id === parsed)) {
            initialId = parsed;
          }
        }
        setSelectedProductId(initialId);
      }
    } catch (err: any) {
      setError('Failed to fetch products list.');
    } finally {
      setInitialLoading(false);
    }
  };

  // Run simulation whenever product, slider quantity, or overrides change
  useEffect(() => {
    if (selectedProductId !== null) {
      runSimulation();
    }
  }, [
    selectedProductId, 
    reorderQuantity, 
    holdingCostOverride, 
    unitCostOverride, 
    sellingPriceOverride, 
    leadTimeOverride
  ]);

  // Adjust initial quantity when switching products
  useEffect(() => {
    if (selectedProductId !== null) {
      // If we came from the recommendations page, use the suggested qty
      if (qtyParam && productIdParam && parseInt(productIdParam, 10) === selectedProductId) {
        setReorderQuantity(parseInt(qtyParam, 10));
      } else {
        // Reset slider to a reasonable baseline
        setReorderQuantity(60);
      }
      
      // Clear overrides on product swap
      setHoldingCostOverride('');
      setUnitCostOverride('');
      setSellingPriceOverride('');
      setLeadTimeOverride('');
    }
  }, [selectedProductId]);

  const runSimulation = async () => {
    if (selectedProductId === null) return;
    setLoading(true);
    try {
      const input: any = {
        product_id: selectedProductId,
        reorder_quantity: reorderQuantity,
      };
      
      if (holdingCostOverride !== '') input.holding_cost_override = parseFloat(holdingCostOverride);
      if (unitCostOverride !== '') input.unit_cost_override = parseFloat(unitCostOverride);
      if (sellingPriceOverride !== '') input.selling_price_override = parseFloat(sellingPriceOverride);
      if (leadTimeOverride !== '') input.lead_time_override = parseInt(leadTimeOverride, 10);

      const res = await api.simulateDecision(input);
      setSimulation(res);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="h-[60vh] w-full flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="h-10 w-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-zinc-500 dark:text-zinc-400 text-sm font-medium">Loading simulation parameters...</p>
        </div>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="max-w-md mx-auto text-center py-12">
        <Sliders className="h-12 w-12 text-zinc-400 mx-auto mb-4" />
        <h3 className="text-lg font-bold">No Products Available</h3>
        <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-2">
          Please upload a CSV dataset on the Settings page first.
        </p>
      </div>
    );
  }

  // Set up chart data comparing Scenario A and B
  const getChartData = () => {
    if (!simulation) return [];
    return [
      {
        name: 'Expected Revenue',
        'AI Recommended': simulation.scenario_a.expected_revenue,
        'Manager Selected': simulation.scenario_b.expected_revenue,
      },
      {
        name: 'Expected Profit',
        'AI Recommended': simulation.scenario_a.expected_profit,
        'Manager Selected': simulation.scenario_b.expected_profit,
      },
      {
        name: 'Holding Cost',
        'AI Recommended': simulation.scenario_a.holding_cost,
        'Manager Selected': simulation.scenario_b.holding_cost,
      }
    ];
  };

  const chartData = getChartData();

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Product Selector Bar */}
      <GlassCard className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex-1 w-full">
          <label className="block text-[10px] uppercase font-bold tracking-wider text-zinc-400 dark:text-zinc-500 mb-1.5">
            Select Product to Simulate
          </label>
          <select
            className="w-full md:max-w-md glass-input font-semibold"
            value={selectedProductId || ''}
            onChange={(e) => setSelectedProductId(parseInt(e.target.value, 10))}
          >
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.product_name} (SKU: {p.sku}) - ${p.price.toFixed(2)}
              </option>
            ))}
          </select>
        </div>
        
        {simulation && (
          <div className="flex items-center space-x-6 text-xs bg-emerald-500/10 dark:bg-emerald-950/20 border border-emerald-500/10 px-4 py-2.5 rounded-xl">
            <div>
              <span className="text-zinc-400 font-medium">Current Stock:</span>{' '}
              <span className="font-bold text-zinc-900 dark:text-white">{simulation.current_inventory} units</span>
            </div>
            <div className="h-4 w-px bg-zinc-200 dark:bg-zinc-800"></div>
            <div>
              <span className="text-zinc-400 font-medium">30D Demand Forecast:</span>{' '}
              <span className="font-bold text-zinc-900 dark:text-white">{simulation.predicted_demand} units</span>
            </div>
          </div>
        )}
      </GlassCard>

      {simulation && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* LEFT: SLIDER AND OVERRIDES (5 cols) */}
          <div className="lg:col-span-4 space-y-6">
            <GlassCard title="Interactive Order Slider" subtitle="Adjust quantity to recalculate business impact.">
              
              {/* Slider Input */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Reorder Quantity</span>
                  <span className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">
                    {reorderQuantity} <span className="text-xs font-bold text-zinc-400">units</span>
                  </span>
                </div>
                
                <input
                  type="range"
                  min="0"
                  max={Math.max(250, simulation.predicted_demand * 2)}
                  step="5"
                  className="w-full h-2 bg-zinc-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                  value={reorderQuantity}
                  onChange={(e) => setReorderQuantity(parseInt(e.target.value, 10))}
                />
                
                <div className="flex justify-between text-[10px] font-bold text-zinc-400">
                  <span>0 units</span>
                  <span>AI Rec: {simulation.scenario_a.reorder_quantity} units</span>
                  <span>Max: {Math.max(250, simulation.predicted_demand * 2)} units</span>
                </div>
              </div>

              {/* Set to AI Recommended shortcut */}
              <button
                onClick={() => setReorderQuantity(simulation.scenario_a.reorder_quantity)}
                disabled={reorderQuantity === simulation.scenario_a.reorder_quantity}
                className="w-full mt-6 py-2.5 bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 text-xs font-bold rounded-xl transition-all disabled:opacity-50 hover:bg-emerald-500/20"
              >
                Reset to AI Recommended ({simulation.scenario_a.reorder_quantity} units)
              </button>
            </GlassCard>

            <GlassCard title="Simulation Parameters" subtitle="Override default economics.">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase font-bold tracking-wider text-zinc-400 mb-1">Selling Price ($)</label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="Auto"
                    className="w-full glass-input py-1.5 px-3 text-xs"
                    value={sellingPriceOverride}
                    onChange={(e) => setSellingPriceOverride(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold tracking-wider text-zinc-400 mb-1">Unit Cost ($)</label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="Auto"
                    className="w-full glass-input py-1.5 px-3 text-xs"
                    value={unitCostOverride}
                    onChange={(e) => setUnitCostOverride(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold tracking-wider text-zinc-400 mb-1">Monthly Hold Cost ($)</label>
                  <input
                    type="number"
                    step="0.05"
                    placeholder="Auto"
                    className="w-full glass-input py-1.5 px-3 text-xs"
                    value={holdingCostOverride}
                    onChange={(e) => setHoldingCostOverride(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold tracking-wider text-zinc-400 mb-1">Lead Time (Days)</label>
                  <input
                    type="number"
                    placeholder="Auto"
                    className="w-full glass-input py-1.5 px-3 text-xs"
                    value={leadTimeOverride}
                    onChange={(e) => setLeadTimeOverride(e.target.value)}
                  />
                </div>
              </div>
            </GlassCard>
          </div>

          {/* RIGHT: COMPARISON STATS & EXPLANATION (8 cols) */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Visual Gauges Row */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              
              {/* Decision Score circular gauge */}
              <GlassCard className="md:col-span-2 flex flex-col items-center justify-center text-center">
                <DecisionScoreGauge 
                  score={simulation.decision_score} 
                  status={simulation.decision_status} 
                />
              </GlassCard>

              {/* Stockout risk meter */}
              <GlassCard className="flex flex-col justify-between p-5">
                <div className="flex items-center space-x-2 text-zinc-400">
                  <AlertTriangle size={16} />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Stockout Probability</span>
                </div>
                <div>
                  <p className="text-3xl font-extrabold text-zinc-900 dark:text-white">
                    {Math.round(simulation.scenario_b.stockout_probability * 100)}%
                  </p>
                  <div className="w-full bg-zinc-200 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden mt-3">
                    <div 
                      className={`h-full ${
                        simulation.scenario_b.stockout_probability > 0.6 
                          ? 'bg-red-500' 
                          : simulation.scenario_b.stockout_probability > 0.25 
                            ? 'bg-amber-500' 
                            : 'bg-emerald-500'
                      }`}
                      style={{ width: `${simulation.scenario_b.stockout_probability * 100}%` }}
                    ></div>
                  </div>
                </div>
                <span className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-2">
                  Target threshold: &lt;10% probability
                </span>
              </GlassCard>

              {/* Overstock risk meter */}
              <GlassCard className="flex flex-col justify-between p-5">
                <div className="flex items-center space-x-2 text-zinc-400">
                  <TrendingDown size={16} />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Overstock Probability</span>
                </div>
                <div>
                  <p className="text-3xl font-extrabold text-zinc-900 dark:text-white">
                    {Math.round(simulation.scenario_b.overstock_risk * 100)}%
                  </p>
                  <div className="w-full bg-zinc-200 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden mt-3">
                    <div 
                      className={`h-full ${
                        simulation.scenario_b.overstock_risk > 0.6 
                          ? 'bg-red-500' 
                          : simulation.scenario_b.overstock_risk > 0.25 
                            ? 'bg-amber-500' 
                            : 'bg-emerald-500'
                      }`}
                      style={{ width: `${simulation.scenario_b.overstock_risk * 100}%` }}
                    ></div>
                  </div>
                </div>
                <span className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-2">
                  Target threshold: &lt;20% risk
                </span>
              </GlassCard>
            </div>

            {/* Side by Side Comparison Grid */}
            <GlassCard title="Side-by-Side Comparison" subtitle="Comparing AI Recommendation against selected quantity.">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-zinc-200 dark:border-zinc-800 text-xs font-bold text-zinc-400 uppercase tracking-wider">
                      <th className="py-2.5 px-3">Metric</th>
                      <th className="py-2.5 px-3 text-right">Scenario A (AI recommended)</th>
                      <th className="py-2.5 px-3 text-right">Scenario B (Manager selected)</th>
                      <th className="py-2.5 px-3 text-right">Net Impact (B - A)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200/50 dark:divide-zinc-800/30 text-sm">
                    <tr>
                      <td className="py-3 px-3 font-semibold text-zinc-700 dark:text-zinc-300">Order Quantity</td>
                      <td className="py-3 px-3 text-right font-mono">{simulation.scenario_a.reorder_quantity} units</td>
                      <td className="py-3 px-3 text-right font-mono">{simulation.scenario_b.reorder_quantity} units</td>
                      <td className="py-3 px-3 text-right font-bold">
                        {simulation.scenario_b.reorder_quantity - simulation.scenario_a.reorder_quantity} units
                      </td>
                    </tr>
                    <tr>
                      <td className="py-3 px-3 font-semibold text-zinc-700 dark:text-zinc-300">Expected Revenue</td>
                      <td className="py-3 px-3 text-right">${simulation.scenario_a.expected_revenue.toLocaleString()}</td>
                      <td className="py-3 px-3 text-right">${simulation.scenario_b.expected_revenue.toLocaleString()}</td>
                      <td className={`py-3 px-3 text-right font-bold ${simulation.net_revenue_diff >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                        {simulation.net_revenue_diff >= 0 ? '+' : ''}${simulation.net_revenue_diff.toLocaleString()}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-3 px-3 font-semibold text-zinc-700 dark:text-zinc-300">Expected Net Cash Profit</td>
                      <td className="py-3 px-3 text-right">${simulation.scenario_a.expected_profit.toLocaleString()}</td>
                      <td className="py-3 px-3 text-right">${simulation.scenario_b.expected_profit.toLocaleString()}</td>
                      <td className={`py-3 px-3 text-right font-bold ${simulation.net_profit_diff >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                        {simulation.net_profit_diff >= 0 ? '+' : ''}${simulation.net_profit_diff.toLocaleString()}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-3 px-3 font-semibold text-zinc-700 dark:text-zinc-300">Estimated Holding Cost</td>
                      <td className="py-3 px-3 text-right">${simulation.scenario_a.holding_cost.toLocaleString()}</td>
                      <td className="py-3 px-3 text-right">${simulation.scenario_b.holding_cost.toLocaleString()}</td>
                      <td className={`py-3 px-3 text-right font-bold ${
                        (simulation.scenario_b.holding_cost - simulation.scenario_a.holding_cost) <= 0 
                          ? 'text-emerald-500' 
                          : 'text-red-500'
                      }`}>
                        ${(simulation.scenario_b.holding_cost - simulation.scenario_a.holding_cost).toLocaleString()}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-3 px-3 font-semibold text-zinc-700 dark:text-zinc-300">Lost Sales (Units)</td>
                      <td className="py-3 px-3 text-right text-zinc-400">{simulation.scenario_a.expected_lost_sales} units</td>
                      <td className="py-3 px-3 text-right font-semibold">{simulation.scenario_b.expected_lost_sales} units</td>
                      <td className={`py-3 px-3 text-right font-bold ${
                        (simulation.scenario_b.expected_lost_sales - simulation.scenario_a.expected_lost_sales) <= 0 
                          ? 'text-emerald-500' 
                          : 'text-red-500'
                      }`}>
                        {simulation.scenario_b.expected_lost_sales - simulation.scenario_a.expected_lost_sales} units
                      </td>
                    </tr>
                    <tr>
                      <td className="py-3 px-3 font-semibold text-zinc-700 dark:text-zinc-300">Days Until Exhaustion</td>
                      <td className="py-3 px-3 text-right">{simulation.scenario_a.days_until_exhaustion} days</td>
                      <td className="py-3 px-3 text-right font-semibold">{simulation.scenario_b.days_until_exhaustion} days</td>
                      <td className="py-3 px-3 text-right font-bold">
                        {(simulation.scenario_b.days_until_exhaustion - simulation.scenario_a.days_until_exhaustion).toFixed(1)} days
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </GlassCard>

            {/* Recharts Bar Chart side-by-side */}
            <GlassCard title="Financial Scenario Comparison" subtitle="Comparing Revenue, Profit, and Holding Costs ($).">
              <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(200, 200, 200, 0.15)"/>
                    <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fill: '#71717a', fontSize: 11 }}/>
                    <YAxis tickLine={false} axisLine={false} tick={{ fill: '#71717a', fontSize: 11 }}/>
                    <Tooltip contentStyle={{ backgroundColor: 'rgba(24, 24, 27, 0.85)', borderRadius: '12px', border: 'none', color: '#fff' }}/>
                    <Legend iconType="circle" />
                    <Bar dataKey="AI Recommended" fill="#10b981" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Manager Selected" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </GlassCard>

            {/* AI Explanation panel */}
            <div className="bg-gradient-to-r from-emerald-600/10 to-teal-500/10 border border-emerald-500/20 rounded-2xl p-6 glow-green relative overflow-hidden">
              {/* Background gradient bubble */}
              <div className="absolute right-[-20px] top-[-20px] h-32 w-32 rounded-full bg-emerald-500/10 blur-[40px]"></div>
              
              <div className="flex items-center space-x-2 text-emerald-700 dark:text-emerald-400 mb-4">
                <Sparkles size={20} className="animate-pulse" />
                <h4 className="font-extrabold text-sm uppercase tracking-wider">Gemini Decision Analysis</h4>
              </div>
              
              {loading ? (
                <div className="flex items-center space-x-3 py-3">
                  <div className="h-4 w-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">Gemini is rewriting explanation...</span>
                </div>
              ) : (
                <div className="text-zinc-700 dark:text-zinc-300 text-sm leading-relaxed whitespace-pre-line font-medium">
                  {simulation.explanation}
                </div>
              )}
            </div>

          </div>

        </div>
      )}
    </div>
  );
};

export default DecisionSimulator;
