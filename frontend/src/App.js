import React, { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Link, useLocation } from "react-router-dom";
import { BarChart3, Users, Shield, TrendingUp, Database, Menu, X } from "lucide-react";
import Dashboard from "./pages/Dashboard";
import MerchantAnalytics from "./pages/MerchantAnalytics";
import CustomerSegmentation from "./pages/CustomerSegmentation";
import FraudMonitoring from "./pages/FraudMonitoring";
import DataProcessing from "./pages/DataProcessing";
import "./index.css";
import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Sidebar = ({ isOpen, setIsOpen }) => {
  const location = useLocation();
  
  const navItems = [
    { path: "/", icon: BarChart3, label: "Dashboard" },
    { path: "/merchants", icon: TrendingUp, label: "Merchant Analytics" },
    { path: "/customers", icon: Users, label: "Customer Segmentation" },
    { path: "/fraud", icon: Shield, label: "Fraud Monitoring" },
    { path: "/data", icon: Database, label: "Data Processing" },
  ];

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <aside 
        className={`
          fixed top-0 left-0 h-screen w-64 glassmorphism z-50
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0
        `}
      >
        <div className="flex flex-col h-full p-6">
          {/* Logo */}
          <div className="flex items-center justify-between mb-12">
            <div>
              <h1 className="text-2xl font-bold text-gradient">AMEX</h1>
              <p className="text-xs text-muted-foreground mt-1">Analytics Platform</p>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="lg:hidden text-muted-foreground hover:text-foreground"
            >
              <X size={24} />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  data-testid={`nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
                  className={`
                    flex items-center gap-3 px-4 py-3 rounded-lg transition-all
                    ${isActive 
                      ? 'bg-primary text-primary-foreground shadow-lg' 
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    }
                  `}
                  onClick={() => setIsOpen(false)}
                >
                  <Icon size={20} />
                  <span className="font-medium">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="pt-6 border-t border-border">
            <p className="text-xs text-muted-foreground">
              © 2025 AMEX Analytics
            </p>
          </div>
        </div>
      </aside>
    </>
  );
};

const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
      
      {/* Main Content */}
      <div className="lg:ml-64">
        {/* Header */}
        <header className="sticky top-0 z-30 glassmorphism border-b border-border">
          <div className="flex items-center justify-between px-6 py-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-foreground"
              data-testid="mobile-menu-button"
            >
              <Menu size={24} />
            </button>
            <div className="flex-1 lg:flex-none">
              <h2 className="text-xl font-bold">Banking Analytics Dashboard</h2>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium">Analyst View</p>
                <p className="text-xs text-muted-foreground">Real-time Data</p>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-6 md:p-8 lg:p-12">
          {children}
        </main>
      </div>
    </div>
  );
};

function App() {
  const [dataInitialized, setDataInitialized] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initialize mock data on first load
    const initData = async () => {
      try {
        const response = await axios.post(`${API}/init-data`);
        console.log("Data initialized:", response.data);
        setDataInitialized(true);
      } catch (error) {
        console.error("Error initializing data:", error);
      } finally {
        setLoading(false);
      }
    };

    initData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Initializing analytics platform...</p>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/merchants" element={<MerchantAnalytics />} />
          <Route path="/customers" element={<CustomerSegmentation />} />
          <Route path="/fraud" element={<FraudMonitoring />} />
          <Route path="/data" element={<DataProcessing />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;
