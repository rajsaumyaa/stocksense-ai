import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import type { RecommendationItem } from '../types';
import GlassCard from '../components/GlassCard';
import { 
  AlertTriangle, 
  ArrowUpRight, 
  CheckCircle, 
  DollarSign, 
  PackageCheck, 
  Sliders, 
  Truck 
} from 'lucide-react';

export const Recommendations: React.FC = () => {
  const [recommendations, setRecommendations] = useState<RecommendationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const navigate = useNavigate();

  useEffect(() => {
    fetchRecommendations();
  }, []);

  const fetchRecommendations = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.getRecommendations();
      setRecommendations(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load recommendations');
    } finally {
      setLoading(false);
    }
  };

  const handleSimulateClick = (productId: number, reorderQty: number) => {
    // Navigate and pre-fill reorder quantity if needed
    navigate(`/simulator?productId=${productId}&qty=${reorderQty}`);
  };

  if (loading) {
    return (
      <div className="h-[60vh] w-full flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="h-10 w-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-zinc-500 dark:text-zinc-400 text-sm font-medium">Running heuristics decision rules...</p>
        </div>
      </div>
    );
  }

  // Separate recommendations by priority
  const highPriority = recommendations.filter(r => r.priority === 'HIGH');
  const mediumPriority = recommendations.filter(r => r.priority === 'MEDIUM');
  const lowPriority = recommendations.filter(r => r.priority === 'LOW');

  return (
    <div className="space-y-8 animate-fade-in">
      {error && (
        <div className="p-4 bg-red-500/10 text-red-500 rounded-xl border border-red-500/20">
          {error}
        </div>
      )}

      {recommendations.length === 0 ? (
        <GlassCard className="text-center py-12">
          <PackageCheck className="h-12 w-12 text-zinc-400 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-zinc-900 dark:text-white">No Recommendations Found</h3>
          <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-2">
            Upload CSV data and trigger forecast training to generate recommendations.
          </p>
        </GlassCard>
      ) : (
        <>
          {/* Summary Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <GlassCard className="border-l-4 border-l-red-500">
              <div className="flex items-center space-x-3 text-red-500 mb-2">
                <AlertTriangle size={20} />
                <h4 className="font-bold text-xs uppercase tracking-wider">Critical Actions</h4>
              </div>
              <p className="text-2xl font-extrabold text-zinc-900 dark:text-white">{highPriority.length}</p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Products requiring immediate restock orders.</p>
            </GlassCard>

            <GlassCard className="border-l-4 border-l-amber-500">
              <div className="flex items-center space-x-3 text-amber-500 mb-2">
                <Truck size={20} />
                <h4 className="font-bold text-xs uppercase tracking-wider">Lead Time Alerts</h4>
              </div>
              <p className="text-2xl font-extrabold text-zinc-900 dark:text-white">{mediumPriority.length}</p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Medium priority early purchases due to vendor lag.</p>
            </GlassCard>

            <GlassCard className="border-l-4 border-l-emerald-500">
              <div className="flex items-center space-x-3 text-emerald-500 mb-2">
                <CheckCircle size={20} />
                <h4 className="font-bold text-xs uppercase tracking-wider">Surplus / Healthy</h4>
              </div>
              <p className="text-2xl font-extrabold text-zinc-900 dark:text-white">{lowPriority.length}</p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Items that are fully stocked or overstocked.</p>
            </GlassCard>
          </div>

          {/* Recommendations Card Stack */}
          <div className="space-y-6">
            <h3 className="text-xl font-extrabold tracking-tight text-zinc-900 dark:text-white">Active Recommendations</h3>
            
            <div className="grid grid-cols-1 gap-6">
              {recommendations.map((rec) => {
                const isHigh = rec.priority === 'HIGH';
                const isMed = rec.priority === 'MEDIUM';
                
                let borderClass = 'border-zinc-200 dark:border-zinc-800';
                let priorityPill = 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400';
                
                if (isHigh) {
                  borderClass = 'border-red-500/30 bg-red-500/[0.02]';
                  priorityPill = 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20';
                } else if (isMed) {
                  borderClass = 'border-amber-500/30 bg-amber-500/[0.02]';
                  priorityPill = 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20';
                }

                return (
                  <div 
                    key={rec.product_id}
                    className={`glass-panel p-6 rounded-2xl border ${borderClass} flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 hover:shadow-md transition-all`}
                  >
                    {/* Left: Product & Text */}
                    <div className="space-y-3 max-w-2xl">
                      <div className="flex items-center space-x-2.5">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${priorityPill}`}>
                          {rec.priority} PRIORITY
                        </span>
                        <span className="text-xs text-zinc-400 dark:text-zinc-500">
                          SKU: {rec.sku} • Warehouse: {rec.warehouse}
                        </span>
                      </div>
                      
                      <h4 className="text-lg font-bold text-zinc-900 dark:text-white">
                        {rec.product_name}
                      </h4>
                      
                      <p className="text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed">
                        {rec.recommendation}
                      </p>
                    </div>

                    {/* Middle: Details Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-white/40 dark:bg-zinc-900/40 p-4 rounded-xl border border-zinc-200/50 dark:border-zinc-800/30 w-full lg:w-auto">
                      <div>
                        <div className="text-[10px] uppercase font-bold tracking-wider text-zinc-400">Current Stock</div>
                        <div className="text-sm font-bold text-zinc-900 dark:text-white mt-0.5">{rec.current_stock}</div>
                      </div>
                      <div>
                        <div className="text-[10px] uppercase font-bold tracking-wider text-zinc-400">30D Demand Est.</div>
                        <div className="text-sm font-bold text-zinc-900 dark:text-white mt-0.5">{Math.round(rec.predicted_demand)}</div>
                      </div>
                      <div>
                        <div className="text-[10px] uppercase font-bold tracking-wider text-zinc-400">Lead Time</div>
                        <div className="text-sm font-bold text-zinc-900 dark:text-white mt-0.5">{rec.lead_time_days} days</div>
                      </div>
                      <div>
                        <div className="text-[10px] uppercase font-bold tracking-wider text-zinc-400">Revenue Impact</div>
                        <div className={`text-sm font-extrabold mt-0.5 ${
                          rec.revenue_impact > 0 
                            ? 'text-emerald-500' 
                            : rec.revenue_impact < 0 
                              ? 'text-pink-500' 
                              : 'text-zinc-500'
                        }`}>
                          {rec.revenue_impact > 0 ? '+' : ''}${rec.revenue_impact.toLocaleString()}
                        </div>
                      </div>
                    </div>

                    {/* Right: Action */}
                    <div className="flex-shrink-0 w-full lg:w-auto">
                      <button
                        onClick={() => handleSimulateClick(rec.product_id, rec.reorder_quantity)}
                        className="w-full lg:w-auto bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-3 px-5 rounded-xl flex items-center justify-center space-x-2 shadow-sm transition-all text-sm"
                      >
                        <Sliders size={16} />
                        <span>Simulate Decision</span>
                        <ArrowUpRight size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Recommendations;
