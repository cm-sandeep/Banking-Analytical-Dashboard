import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Users, TrendingUp, DollarSign, Target } from "lucide-react";
import { StatCard } from "../components/StatCard";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const COLORS = ['#006FCF', '#FDBF5E', '#22C55E', '#EF4444'];

const CustomerSegmentation = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(`${API}/customers/segmentation`);
        setData(response.data);
      } catch (error) {
        console.error("Error fetching customer data:", error);
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
        Failed to load customer data
      </div>
    );
  }

  const segmentData = Object.entries(data.segment_breakdown).map(([segment, stats]) => ({
    name: segment,
    count: stats.count,
    total_spent: stats.total_spent,
    avg_spent: stats.avg_spent
  }));

  const totalSpent = segmentData.reduce((sum, s) => sum + s.total_spent, 0);
  const avgCustomerValue = totalSpent / data.total_customers;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="space-y-8"
      data-testid="customer-segmentation-page"
    >
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold mb-2">Customer Segmentation</h1>
        <p className="text-muted-foreground">Demographic analysis and spending patterns</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard
          title="Total Customers"
          value={data.total_customers.toLocaleString()}
          subtitle="Active users"
          icon={Users}
          color="primary"
        />
        <StatCard
          title="Total Spending"
          value={`$${totalSpent.toLocaleString()}`}
          subtitle="All segments"
          icon={DollarSign}
          color="success"
        />
        <StatCard
          title="Avg Customer Value"
          value={`$${avgCustomerValue.toFixed(2)}`}
          subtitle="Per customer"
          icon={TrendingUp}
          color="secondary"
        />
        <StatCard
          title="Segments"
          value={segmentData.length}
          subtitle="Customer groups"
          icon={Target}
          color="info"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Segment Distribution */}
        <div className="bg-card border border-white/10 rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4">Segment Distribution</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={segmentData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, count }) => `${name}: ${count}`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="count"
              >
                {segmentData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ backgroundColor: '#151921', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Spending by Segment */}
        <div className="bg-card border border-white/10 rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4">Average Spending by Segment</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={segmentData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2D3748" />
              <XAxis 
                dataKey="name" 
                stroke="#94A3B8"
                tick={{ fill: '#94A3B8', fontSize: 12 }}
              />
              <YAxis 
                stroke="#94A3B8"
                tick={{ fill: '#94A3B8', fontSize: 12 }}
              />
              <Tooltip 
                contentStyle={{ backgroundColor: '#151921', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                labelStyle={{ color: '#F8FAFC' }}
              />
              <Bar dataKey="avg_spent" fill="#FDBF5E" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Segment Details */}
      <div className="bg-card border border-white/10 rounded-lg p-6">
        <h2 className="text-xl font-bold mb-4">Segment Details</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {segmentData.map((segment, idx) => (
            <div 
              key={idx}
              className="border border-border rounded-lg p-4 hover:border-primary/50 transition-colors"
            >
              <h3 className="text-lg font-bold mb-2">{segment.name}</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Customers:</span>
                  <span className="font-medium">{segment.count}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Spent:</span>
                  <span className="font-medium">${segment.total_spent.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Avg Spent:</span>
                  <span className="font-medium">${segment.avg_spent.toLocaleString()}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Customer Table */}
      <div className="bg-card border border-white/10 rounded-lg p-6">
        <h2 className="text-xl font-bold mb-4">Customer Details</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Customer</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Email</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Segment</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Transactions</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Total Spent</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Risk Score</th>
              </tr>
            </thead>
            <tbody>
              {data.customers.slice(0, 20).map((customer, idx) => (
                <tr key={idx} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                  <td className="py-3 px-4 text-sm font-medium">{customer.name}</td>
                  <td className="py-3 px-4 text-sm text-muted-foreground">{customer.email}</td>
                  <td className="py-3 px-4 text-sm">
                    <span className={`
                      px-2 py-1 rounded-full text-xs font-medium
                      ${customer.segment === 'VIP' ? 'bg-secondary/20 text-secondary' : 
                        customer.segment === 'Premium' ? 'bg-primary/20 text-primary' : 
                        'bg-muted text-muted-foreground'
                      }
                    `}>
                      {customer.segment}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm text-right">{customer.transaction_count}</td>
                  <td className="py-3 px-4 text-sm text-right font-medium">${customer.total_spent.toLocaleString()}</td>
                  <td className="py-3 px-4 text-right">
                    <span className={`
                      px-2 py-1 rounded-full text-xs font-medium
                      ${customer.risk_score < 0.3 ? 'bg-success/20 text-success' : 
                        customer.risk_score < 0.7 ? 'bg-warning/20 text-warning' : 
                        'bg-destructive/20 text-destructive'
                      }
                    `}>
                      {(customer.risk_score * 100).toFixed(0)}%
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

export default CustomerSegmentation;
