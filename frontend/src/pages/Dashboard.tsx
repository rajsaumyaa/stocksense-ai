import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import type { DashboardData } from '../types';
import GlassCard from '../components/GlassCard';
import { 
  TrendingUp, 
  DollarSign, 
  Package, 
  AlertTriangle, 
  FileSpreadsheet, 
  Database,
  ArrowRight,
  TrendingDown
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend
} from 'recharts';

export const Dashboard: React.FC = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError('');
    try {
      const dashboardRes = await api.getDashboardData();
      setData(dashboardRes);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="h-[60vh] w-full flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="h-10 w-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-zinc-500 dark:text-zinc-400 text-sm font-medium">Assembling dashboard analytics...</p>
        </div>
      </div>
    );
  }

  // Handle case where database is empty
  const isEmpty = !data || data.kpis.total_products === 0;

  if (isEmpty) {
    return (
      <div className="space-y-6">
        <GlassCard className="text-center py-16 max-w-2xl mx-auto mt-10">
          <div className="h-16 w-16 bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-6">
            <Database size={32} />
          </div>
          <h2 className="text-3xl font-extrabold text-zinc-900 dark:text-white tracking-tight">
            Database Empty
          </h2>
          <p className="text-zinc-500 dark:text-zinc-400 mt-3 max-w-md mx-auto text-sm leading-relaxed">
            Welcome to StockSense AI! To get started, you need to ingest a retail dataset containing products, inventory, and historical sales transactions.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row justify-center space-y-3 sm:space-y-0 sm:space-x-4">
            <Link
              to="/settings"
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-6 py-3 rounded-xl flex items-center justify-center space-x-2 shadow-lg shadow-emerald-600/20 transition-all duration-150"
            >
              <FileSpreadsheet size={18} />
              <span>Go to Data Ingestion</span>
              <ArrowRight size={16} />
            </Link>
          </div>
        </GlassCard>
      </div>
    );
  }

  const kpis = data.kpis;
  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4'];

  const kpiCards = [
    {
      title: "Today's Revenue",
      value: kpis.today_revenue,
      icon: DollarSign,
      type: "currency",
      color: "text-emerald-500 bg-emerald-500/10",
      description: "Aggregated sales for last active day"
    },
    {
      title: "Inventory Value",
      value: kpis.inventory_value,
      icon: Package,
      type: "currency",
      color: "text-blue-500 bg-blue-500/10",
      description: "Current stock asset evaluation"
    },
    {
      title: "Total Products",
      value: kpis.total_products,
      icon: Database,
      type: "number",
      color: "text-indigo-500 bg-indigo-500/10",
      description: "Unique SKUs registered in database"
    },
    {
      title: "Low Stock Items",
      value: kpis.low_stock_products,
      icon: AlertTriangle,
      type: "number",
      color: kpis.low_stock_products > 0 ? "text-amber-500 bg-amber-500/10 animate-pulse" : "text-zinc-500 bg-zinc-500/10",
      description: "Products below reorder levels"
    },
    {
      title: "Overstock Items",
      value: kpis.overstock_products,
      icon: TrendingDown,
      type: "number",
      color: "text-pink-500 bg-pink-500/10",
      description: "Products with high holding costs"
    },
    {
      title: "Tomorrow Revenue Est.",
      value: kpis.predicted_tomorrow_revenue,
      icon: TrendingUp,
      type: "currency",
      color: "text-teal-500 bg-teal-500/10",
      description: "Expected sales from XGBoost forecast"
    }
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {error && (
        <div className="p-4 bg-red-500/10 text-red-500 border border-red-500/20 rounded-xl">
          {error}
        </div>
      )}
      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {kpiCards.map((card, idx) => (
          <GlassCard key={idx} className="hover:scale-[1.01]">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                  {card.title}
                </p>
                <h3 className="text-3xl font-extrabold text-zinc-900 dark:text-white mt-2 tracking-tight">
                  {card.type === "currency" 
                    ? `$${card.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                    : card.value.toLocaleString()
                  }
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2 leading-relaxed">
                  {card.description}
                </p>
              </div>
              <div className={`p-3 rounded-2xl ${card.color}`}>
                <card.icon className="h-6 w-6" />
              </div>
            </div>
          </GlassCard>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Trend (Spans 2 cols) */}
        <GlassCard 
          className="lg:col-span-2" 
          title="Daily Sales & Revenue Trend" 
          subtitle="Showing daily retail revenue over the past month."
        >
          <div className="h-[320px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.sales_trends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(200, 200, 200, 0.15)"/>
                <XAxis 
                  dataKey="date" 
                  tickLine={false} 
                  axisLine={false}
                  tick={{ fill: '#71717a', fontSize: 11 }}
                />
                <YAxis 
                  tickLine={false} 
                  axisLine={false}
                  tick={{ fill: '#71717a', fontSize: 11 }}
                  tickFormatter={(v) => `$${v}`}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'rgba(24, 24, 27, 0.85)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}
                  labelClassName="font-bold text-xs"
                />
                <Area type="monotone" dataKey="revenue" name="Daily Revenue" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#colorRevenue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        {/* Category Breakdown (Spans 1 col) */}
        <GlassCard 
          title="Revenue by Category" 
          subtitle="Revenue breakdown across product categories."
        >
          <div className="h-[320px] w-full flex flex-col justify-between">
            <div className="h-[220px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.category_breakdown}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="revenue"
                    nameKey="category"
                  >
                    {data.category_breakdown.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'rgba(24, 24, 27, 0.85)', borderRadius: '12px', border: 'none', color: '#fff' }}
                    formatter={(v) => `$${Number(v).toFixed(2)}`}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            {/* Custom Legend */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              {data.category_breakdown.slice(0, 6).map((item, idx) => (
                <div key={idx} className="flex items-center space-x-1.5 truncate">
                  <div className="h-2 w-2 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></div>
                  <span className="text-zinc-500 dark:text-zinc-400 truncate">{item.category}</span>
                  <span className="font-semibold text-zinc-900 dark:text-zinc-200">${Math.round(item.revenue)}</span>
                </div>
              ))}
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Supplier Performance Chart */}
      <GlassCard 
        title="Supplier Units Sold & Portfolio Size" 
        subtitle="Analysing product quantities sold and count of unique products per supplier."
      >
        <div className="h-[340px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.supplier_performance} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(200, 200, 200, 0.15)"/>
              <XAxis 
                dataKey="supplier" 
                tickLine={false} 
                axisLine={false}
                tick={{ fill: '#71717a', fontSize: 11 }}
              />
              <YAxis 
                tickLine={false} 
                axisLine={false}
                tick={{ fill: '#71717a', fontSize: 11 }}
              />
              <Tooltip
                contentStyle={{ backgroundColor: 'rgba(24, 24, 27, 0.85)', borderRadius: '12px', border: 'none', color: '#fff' }}
              />
              <Legend verticalAlign="top" height={36} iconType="circle" />
              <Bar dataKey="total_sold" name="Units Sold" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="products_count" name="Unique Products" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </GlassCard>
    </div>
  );
};

export default Dashboard;
