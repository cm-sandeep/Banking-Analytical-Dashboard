import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { TrendingUp, DollarSign, ShoppingBag } from "lucide-react";
import { StatCard } from "../components/StatCard";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const COLORS = ['#006FCF', '#FDBF5E', '#22C55E', '#EF4444', '#8B5CF6', '#3B82F6', '#F59E0B', '#EC4899'];

const MerchantAnalytics = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(`${API}/merchants/analytics`);
        setData(response.data);
      } catch (error) {
        console.error("Error fetching merchant data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center text-muted-foreground">
        Failed to load merchant data
      </div>
    );
  }

  const categoryData = Object.entries(data.category_breakdown).map(([category, stats]) => ({
    name: category,
    value: stats.revenue,
    count: stats.count
  }));

  const totalMerchants = data.merchants.length;
  const totalRevenue = data.merchants.reduce((sum, m) => sum + m.total_revenue, 0);
  const avgOfferPerf = data.merchants.reduce((sum, m) => sum + m.offer_performance, 0) / totalMerchants;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="space-y-8"
      data-testid="merchant-analytics-page"
    >
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold mb-2">Merchant Analytics</h1>
        <p className="text-muted-foreground">Performance tracking and offer analytics</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="Total Merchants"
          value={totalMerchants}
          subtitle="Active partners"
          icon={ShoppingBag}
          color="primary"
        />
        <StatCard
          title="Total Revenue"
          value={`$${totalRevenue.toLocaleString()}`}
          subtitle="Across all merchants"
          icon={DollarSign}
          color="success"
        />
        <StatCard
          title="Avg Offer Performance"
          value={`${avgOfferPerf.toFixed(1)}%`}
          subtitle="Success rate"
          icon={TrendingUp}
          color="secondary"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Performers */}
        <div className="bg-card border border-white/10 rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4">Top Performers</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.top_performers}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2D3748" />
              <XAxis 
                dataKey="name" 
                stroke="#94A3B8"
                tick={{ fill: '#94A3B8', fontSize: 11 }}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis 
                stroke="#94A3B8"
                tick={{ fill: '#94A3B8', fontSize: 12 }}
              />
              <Tooltip 
                contentStyle={{ backgroundColor: '#151921', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                labelStyle={{ color: '#F8FAFC' }}
              />
              <Bar dataKey="total_revenue" fill="#006FCF" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Category Breakdown */}
        <div className="bg-card border border-white/10 rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4">Category Distribution</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {categoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ backgroundColor: '#151921', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Merchant Table */}
      <div className="bg-card border border-white/10 rounded-lg p-6">
        <h2 className="text-xl font-bold mb-4">All Merchants</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Merchant</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Category</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Transactions</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Revenue</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Avg Transaction</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Offer Performance</th>
              </tr>
            </thead>
            <tbody>
              {data.merchants.map((merchant, idx) => (
                <tr key={idx} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                  <td className="py-3 px-4 text-sm font-medium">{merchant.name}</td>
                  <td className="py-3 px-4 text-sm">
                    <span className="px-2 py-1 bg-muted rounded-full text-xs">
                      {merchant.category}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm text-right">{merchant.total_transactions}</td>
                  <td className="py-3 px-4 text-sm text-right font-medium">${merchant.total_revenue.toLocaleString()}</td>
                  <td className="py-3 px-4 text-sm text-right">${merchant.avg_transaction.toLocaleString()}</td>
                  <td className="py-3 px-4 text-right">
                    <span className={`
                      px-2 py-1 rounded-full text-xs font-medium
                      ${merchant.offer_performance >= 80 ? 'bg-success/20 text-success' : 
                        merchant.offer_performance >= 70 ? 'bg-warning/20 text-warning' : 
                        'bg-destructive/20 text-destructive'
                      }
                    `}>
                      {merchant.offer_performance.toFixed(1)}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
};

export default MerchantAnalytics;
