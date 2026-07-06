import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  TrendingUp, 
  CheckSquare, 
  Sliders, 
  MessageSquare, 
  Settings, 
  LogOut,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  TrendingDown
} from 'lucide-react';

interface SidebarProps {
  userName?: string;
  onLogout?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  userName = "Store Manager", 
  onLogout 
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const navigate = useNavigate();

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Inventory', path: '/inventory', icon: Package },
    { name: 'Forecast', path: '/forecast', icon: TrendingUp },
    { name: 'Recommendations', path: '/recommendations', icon: CheckSquare },
    { name: 'Decision Simulator', path: '/simulator', icon: Sliders },
    { name: 'AI Chat Assistant', path: '/chat', icon: MessageSquare },
    { name: 'Settings & Looker', path: '/settings', icon: Settings },
  ];

  const handleLogoutClick = () => {
    if (onLogout) {
      onLogout();
    } else {
      localStorage.removeItem('stocksense_token');
      localStorage.removeItem('stocksense_user');
      navigate('/login');
    }
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300">
      {/* Brand Logo & Name */}
      <div className="flex items-center justify-between p-5 border-b border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center space-x-3">
          <div className="h-8 w-8 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-bold text-lg shadow-md shadow-emerald-600/30">
            S
          </div>
          {!isCollapsed && (
            <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">
              StockSense AI
            </span>
          )}
        </div>
        
        {/* Toggle Collapse (Desktop only) */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="hidden md:flex h-6 w-6 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 items-center justify-center text-zinc-400"
        >
          {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      {/* Nav Links */}
      <nav className="flex-1 px-3 py-6 space-y-1.5 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `
              flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-150
              ${isActive 
                ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 shadow-sm border border-emerald-100/50 dark:border-emerald-900/20' 
                : 'hover:bg-zinc-50 dark:hover:bg-zinc-800/40 text-zinc-600 dark:text-zinc-400'
              }
            `}
            onClick={() => setIsMobileOpen(false)}
          >
            <item.icon className="h-5 w-5 flex-shrink-0" />
            {!isCollapsed && <span>{item.name}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Footer Profile / Logout */}
      <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 flex flex-col space-y-2">
        {!isCollapsed && (
          <div className="px-2 py-1">
            <p className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Logged in as</p>
            <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 truncate">{userName}</p>
          </div>
        )}
        <button
          onClick={handleLogoutClick}
          className="flex items-center space-x-3 px-4 py-2.5 rounded-xl text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all w-full"
        >
          <LogOut className="h-5 w-5 flex-shrink-0" />
          {!isCollapsed && <span>Logout</span>}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Top Bar */}
      <div className="md:hidden flex items-center justify-between p-4 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 fixed top-0 w-full z-40">
        <div className="flex items-center space-x-2">
          <div className="h-7 w-7 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-bold text-base">
            S
          </div>
          <span className="font-bold tracking-tight text-zinc-800 dark:text-white">StockSense AI</span>
        </div>
        <button
          onClick={() => setIsMobileOpen(true)}
          className="p-1 rounded-md text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
        >
          <Menu size={24} />
        </button>
      </div>

      {/* Mobile Sidebar Modal Drawer */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          {/* Overlay */}
          <div 
            className="fixed inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setIsMobileOpen(false)}
          />
          {/* Drawer content */}
          <div className="relative w-72 h-full flex flex-col z-10 animate-slide-in">
            <button
              onClick={() => setIsMobileOpen(false)}
              className="absolute top-4 right-[-44px] p-2 rounded-full bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 shadow-md border border-zinc-200 dark:border-zinc-700"
            >
              <X size={20} />
            </button>
            {sidebarContent}
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <div 
        className={`hidden md:block h-screen fixed left-0 top-0 z-30 transition-all duration-300 ${isCollapsed ? 'w-20' : 'w-64'}`}
      >
        {sidebarContent}
      </div>
      
      {/* Sidebar spacer for content alignment */}
      <div className={`hidden md:block h-screen transition-all duration-300 flex-shrink-0 ${isCollapsed ? 'w-20' : 'w-64'}`} />
    </>
  );
};

export default Sidebar;
