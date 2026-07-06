import React, { useEffect, useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import DarkModeToggle from '../components/DarkModeToggle';

export const MainLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [userName, setUserName] = useState('Store Manager');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('stocksense_token');
    const userStr = localStorage.getItem('stocksense_user');
    
    if (!token) {
      navigate('/login');
    } else {
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          setUserName(user.name || 'Store Manager');
        } catch {
          // ignore
        }
      }
      setLoading(false);
    }
  }, [navigate, location]);

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <div className="flex flex-col items-center space-y-4">
          <div className="h-10 w-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-zinc-500 dark:text-zinc-400 text-sm font-medium">Securing session...</p>
        </div>
      </div>
    );
  }

  // Get Page Titles dynamically based on pathname
  const getPageHeader = () => {
    const path = location.pathname;
    if (path === '/') return { title: 'Operational Dashboard', subtitle: 'Overview of retail sales, inventory counts, and forecasting alerts.' };
    if (path === '/inventory') return { title: 'Inventory Directory', subtitle: 'Search, filter, and inspect stock items across your warehouses.' };
    if (path === '/forecast') return { title: 'Predictive Demand Forecast', subtitle: 'Tomorrow and next-week purchase demand driven by XGBoost ML.' };
    if (path === '/recommendations') return { title: 'Restocking Suggestions', subtitle: 'AI-guided restock orders, risk analysis, and revenue impacts.' };
    if (path === '/simulator') return { title: 'Decision Impact Simulator', subtitle: 'Flagship tool: simulate order size adjustments and review visual trade-offs.' };
    if (path === '/chat') return { title: 'AI Assistant Chat', subtitle: 'Ask Gemini questions about reorders, overstocks, and sales patterns.' };
    if (path === '/settings') return { title: 'Looker Studio & Credentials', subtitle: 'Access database views for Looker Studio and update configurations.' };
    return { title: 'StockSense AI', subtitle: 'AI Powered Retail Inventory Decision Intelligence Platform' };
  };

  const header = getPageHeader();

  return (
    <div className="flex min-h-screen bg-zinc-50 dark:bg-zinc-950">
      {/* Sidebar Navigation */}
      <Sidebar userName={userName} />

      {/* Main Content Pane */}
      <div className="flex-1 flex flex-col min-w-0 md:pl-0 pt-16 md:pt-0">
        {/* Top Header Panel */}
        <header className="flex items-center justify-between p-6 border-b border-zinc-200/80 dark:border-zinc-800/40 bg-white/50 dark:bg-zinc-900/20 backdrop-blur-md sticky top-0 z-20">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-zinc-950 dark:text-white">
              {header.title}
            </h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
              {header.subtitle}
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <DarkModeToggle />
          </div>
        </header>

        {/* Page Inner Container */}
        <main className="flex-1 p-6 md:p-8 max-w-[1600px] w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
