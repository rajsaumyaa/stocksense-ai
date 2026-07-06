import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Inventory from './pages/Inventory';
import Forecast from './pages/Forecast';
import Recommendations from './pages/Recommendations';
import DecisionSimulator from './pages/DecisionSimulator';
import AIChat from './pages/AIChat';
import Settings from './pages/Settings';

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        {/* Authentication page */}
        <Route path="/login" element={<Login />} />
        
        {/* Protected Dashboard Shell */}
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="inventory" element={<Inventory />} />
          <Route path="forecast" element={<Forecast />} />
          <Route path="recommendations" element={<Recommendations />} />
          <Route path="simulator" element={<DecisionSimulator />} />
          <Route path="chat" element={<AIChat />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </Router>
  );
};

export default App;
