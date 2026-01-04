import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, Shield, DollarSign, TrendingDown, AlertCircle, Zap } from "lucide-react";
import { StatCard } from "../components/StatCard";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import axios from "axios";
import { toast } from "sonner";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const FraudMonitoring = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [analysis, setAnalysis] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(`${API}/fraud/monitor`);
        setData(response.data);
      } catch (error) {
        console.error("Error fetching fraud data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const analyzeTransaction = async (transactionId) => {
    setAnalyzing(true);
    setAnalysis(null);
    
    try {
      const response = await axios.post(`${API}/fraud/analyze`, {
        transaction_id: transactionId
      });
      setAnalysis(response.data.analysis);
      toast.success("AI Fraud Analysis Complete");
    } catch (error) {
      console.error("Error analyzing transaction:", error);
      toast.error("Failed to analyze transaction");
    } finally {
      setAnalyzing(false);
    }
  };

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
        Failed to load fraud data
      </div>
    );
  }

  const categoryData = Object.entries(data.fraud_by_category).map(([category, stats]) => ({
    name: category,
    count: stats.count,
    amount: stats.amount
  }));

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="space-y-8"
      data-testid="fraud-monitoring-page"
    >
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold mb-2">Fraud Monitoring</h1>
        <p className="text-muted-foreground">AI-powered transaction monitoring and fraud detection</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard
          title="Fraud Alerts"
          value={data.total_fraud_count}
          subtitle="Flagged transactions"
          icon={AlertTriangle}
          color="destructive"
        />
        <StatCard
          title="Fraud Amount"
          value={`$${data.total_fraud_amount.toLocaleString()}`}
          subtitle="Total potential loss"
          icon={DollarSign}
          color="warning"
        />
        <StatCard
          title="High Risk"
          value={data.high_risk_transactions.length}
          subtitle="Critical alerts"
          icon={Shield}
          color="destructive"
        />
        <StatCard
          title="Detection Rate"
          value="98.5%"
          subtitle="AI accuracy"
          icon={TrendingDown}
          color="success"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Fraud by Category */}
        <div className="bg-card border border-white/10 rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4">Fraud by Category</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={categoryData}>
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
              <Bar dataKey="count" fill="#EF4444" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* High Risk Alerts */}
        <div className="bg-card border border-white/10 rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <AlertCircle className="text-destructive" size={24} />
            High Risk Alerts
          </h2>
          <div className="space-y-3">
            {data.high_risk_transactions.map((txn, idx) => (
              <div 
                key={idx}
                className="border border-destructive/50 rounded-lg p-4 bg-destructive/10"
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-medium">{txn.merchant_name}</p>
                    <p className="text-sm text-muted-foreground">{txn.location}</p>
                  </div>
                  <span className="text-lg font-bold text-destructive">
                    ${txn.amount.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    Risk Score: {(txn.fraud_score * 100).toFixed(0)}%
                  </span>
                  <button
                    onClick={() => {
                      setSelectedTransaction(txn);
                      analyzeTransaction(txn.id);
                    }}
                    className="text-xs px-3 py-1 bg-primary hover:bg-primary/90 text-white rounded-full transition-colors"
                    data-testid={`analyze-fraud-btn-${idx}`}
                  >
                    <Zap size={12} className="inline mr-1" />
                    AI Analyze
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* AI Analysis Result */}
      {analyzing && (
        <div className="bg-card border border-primary/50 rounded-lg p-6">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 border-3 border-primary border-t-transparent rounded-full animate-spin"></div>
            <p className="text-muted-foreground">Analyzing transaction with Gemini 3 Flash...</p>
          </div>
        </div>
      )}

      {analysis && selectedTransaction && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card border border-primary/50 rounded-lg p-6"
          data-testid="ai-analysis-result"
        >
          <div className="flex items-center gap-3 mb-4">
            <Shield className="text-primary" size={28} />
            <div>
              <h2 className="text-xl font-bold">Gemini AI Fraud Analysis</h2>
              <p className="text-sm text-muted-foreground">Transaction: {selectedTransaction.merchant_name}</p>
            </div>
          </div>

          {analysis.success ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border border-border rounded-lg p-4">
                  <p className="text-sm text-muted-foreground mb-1">Risk Level</p>
                  <p className={`text-2xl font-bold ${
                    analysis.analysis.risk_level === 'Critical' ? 'text-destructive' :
                    analysis.analysis.risk_level === 'High' ? 'text-warning' :
                    analysis.analysis.risk_level === 'Medium' ? 'text-secondary' :
                    'text-success'
                  }`}>
                    {analysis.analysis.risk_level}
                  </p>
                </div>
                <div className="border border-border rounded-lg p-4">
                  <p className="text-sm text-muted-foreground mb-1">Fraud Probability</p>
                  <p className="text-2xl font-bold text-destructive">
                    {analysis.analysis.fraud_probability}%
                  </p>
                </div>
              </div>

              <div className="border border-border rounded-lg p-4">
                <p className="text-sm font-medium mb-2">Risk Factors:</p>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  {analysis.analysis.risk_factors.map((factor, idx) => (
                    <li key={idx}>{factor}</li>
                  ))}
                </ul>
              </div>

              <div className="border border-border rounded-lg p-4">
                <p className="text-sm font-medium mb-2">Recommendation:</p>
                <p className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                  analysis.analysis.recommendation === 'Block' ? 'bg-destructive/20 text-destructive' :
                  analysis.analysis.recommendation === 'Review' ? 'bg-warning/20 text-warning' :
                  'bg-success/20 text-success'
                }`}>
                  {analysis.analysis.recommendation}
                </p>
              </div>

              <div className="border border-border rounded-lg p-4">
                <p className="text-sm font-medium mb-2">Explanation:</p>
                <p className="text-sm text-muted-foreground">
                  {analysis.analysis.explanation}
                </p>
              </div>
            </div>
          ) : (
            <div className="text-destructive">
              Error: {analysis.error}
            </div>
          )}
        </motion.div>
      )}

      {/* Fraud Transactions Table */}
      <div className="bg-card border border-white/10 rounded-lg p-6">
        <h2 className="text-xl font-bold mb-4">Flagged Transactions</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Merchant</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Amount</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Category</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Location</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Fraud Score</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Action</th>
              </tr>
            </thead>
            <tbody>
              {data.fraud_transactions.map((txn, idx) => (
                <tr key={idx} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                  <td className="py-3 px-4 text-sm font-medium">{txn.merchant_name}</td>
                  <td className="py-3 px-4 text-sm font-medium text-destructive">
                    ${txn.amount.toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-sm">
                    <span className="px-2 py-1 bg-muted rounded-full text-xs">
                      {txn.category}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm text-muted-foreground">{txn.location}</td>
                  <td className="py-3 px-4">
                    <span className={`
                      px-2 py-1 rounded-full text-xs font-medium
                      ${txn.fraud_score >= 0.8 ? 'bg-destructive/20 text-destructive' : 
                        txn.fraud_score >= 0.5 ? 'bg-warning/20 text-warning' : 
                        'bg-success/20 text-success'
                      }
                    `}>
                      {(txn.fraud_score * 100).toFixed(0)}%
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <button
                      onClick={() => {
                        setSelectedTransaction(txn);
                        analyzeTransaction(txn.id);
                      }}
                      className="text-xs px-3 py-1 bg-primary hover:bg-primary/90 text-white rounded-full transition-colors"
                      data-testid={`analyze-btn-${idx}`}
                    >
                      Analyze
                    </button>
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

export default FraudMonitoring;
