import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Database, Code, Play, CheckCircle } from "lucide-react";
import axios from "axios";
import { toast } from "sonner";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const DataProcessing = () => {
  const [sqlQuery, setSqlQuery] = useState("SELECT * FROM transactions LIMIT 10");
  const [sqlResult, setSqlResult] = useState(null);
  const [sqlLoading, setSqlLoading] = useState(false);

  const [pysparkOperation, setPysparkOperation] = useState("aggregate_by_category");
  const [pysparkResult, setPysparkResult] = useState(null);
  const [pysparkLoading, setPysparkLoading] = useState(false);

  const executeSqlQuery = async () => {
    setSqlLoading(true);
    setSqlResult(null);
    
    try {
      const response = await axios.post(`${API}/sql/query`, {
        query: sqlQuery
      });
      setSqlResult(response.data);
      if (response.data.success) {
        toast.success("SQL query executed successfully");
      } else {
        toast.error(response.data.error);
      }
    } catch (error) {
      console.error("Error executing SQL:", error);
      toast.error("Failed to execute SQL query");
    } finally {
      setSqlLoading(false);
    }
  };

  const runPysparkTransformation = async () => {
    setPysparkLoading(true);
    setPysparkResult(null);
    
    try {
      const response = await axios.post(`${API}/pyspark/transform`, {
        operation: pysparkOperation
      });
      setPysparkResult(response.data);
      if (response.data.success) {
        toast.success("PySpark transformation completed");
      } else {
        toast.error(response.data.error);
      }
    } catch (error) {
      console.error("Error running PySpark:", error);
      toast.error("Failed to run PySpark transformation");
    } finally {
      setPysparkLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="space-y-8"
      data-testid="data-processing-page"
    >
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold mb-2">Data Processing</h1>
        <p className="text-muted-foreground">SQL queries and PySpark transformations demonstration</p>
      </div>

      {/* SQL Section */}
      <div className="bg-card border border-white/10 rounded-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <Database className="text-primary" size={28} />
          <div>
            <h2 className="text-xl font-bold">SQL Query Executor</h2>
            <p className="text-sm text-muted-foreground">Execute SQL queries on banking data</p>
          </div>
        </div>

        {/* SQL Query Input */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Query</label>
          <textarea
            value={sqlQuery}
            onChange={(e) => setSqlQuery(e.target.value)}
            className="w-full bg-muted/50 border border-input rounded-lg p-3 font-mono text-sm focus:ring-2 focus:ring-primary/50 focus:outline-none resize-none"
            rows={4}
            placeholder="SELECT * FROM transactions WHERE amount > 1000"
            data-testid="sql-query-input"
          />
        </div>

        {/* Predefined Queries */}
        <div className="flex flex-wrap gap-2 mb-4">
          <button
            onClick={() => setSqlQuery("SELECT * FROM transactions LIMIT 10")}
            className="text-xs px-3 py-1 bg-muted hover:bg-muted/70 rounded-full transition-colors"
          >
            All Transactions
          </button>
          <button
            onClick={() => setSqlQuery("SELECT * FROM merchants LIMIT 20")}
            className="text-xs px-3 py-1 bg-muted hover:bg-muted/70 rounded-full transition-colors"
          >
            All Merchants
          </button>
          <button
            onClick={() => setSqlQuery("SELECT * FROM customers LIMIT 20")}
            className="text-xs px-3 py-1 bg-muted hover:bg-muted/70 rounded-full transition-colors"
          >
            All Customers
          </button>
          <button
            onClick={() => setSqlQuery("SELECT COUNT(*) FROM transactions")}
            className="text-xs px-3 py-1 bg-muted hover:bg-muted/70 rounded-full transition-colors"
          >
            Count Transactions
          </button>
        </div>

        <button
          onClick={executeSqlQuery}
          disabled={sqlLoading}
          className="px-6 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2"
          data-testid="execute-sql-btn"
        >
          {sqlLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Executing...
            </>
          ) : (
            <>
              <Play size={16} />
              Execute Query
            </>
          )}
        </button>

        {/* SQL Results */}
        {sqlResult && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6"
          >
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle className="text-success" size={20} />
              <span className="text-sm font-medium">Results ({sqlResult.count} rows)</span>
            </div>
            <div className="bg-background rounded-lg p-4 max-h-96 overflow-auto">
              <pre className="text-xs font-mono">
                {JSON.stringify(sqlResult.result, null, 2)}
              </pre>
            </div>
          </motion.div>
        )}
      </div>

      {/* PySpark Section */}
      <div className="bg-card border border-white/10 rounded-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <Code className="text-secondary" size={28} />
          <div>
            <h2 className="text-xl font-bold">PySpark Transformations</h2>
            <p className="text-sm text-muted-foreground">Distributed data processing with Apache Spark</p>
          </div>
        </div>

        {/* Operation Selection */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Select Operation</label>
          <select
            value={pysparkOperation}
            onChange={(e) => setPysparkOperation(e.target.value)}
            className="w-full bg-muted/50 border border-input rounded-lg p-3 text-sm focus:ring-2 focus:ring-primary/50 focus:outline-none"
            data-testid="pyspark-operation-select"
          >
            <option value="aggregate_by_category">Aggregate by Category</option>
            <option value="fraud_analysis">Fraud Analysis</option>
            <option value="merchant_performance">Merchant Performance</option>
          </select>
        </div>

        <button
          onClick={runPysparkTransformation}
          disabled={pysparkLoading}
          className="px-6 py-2 bg-secondary hover:bg-secondary/90 text-secondary-foreground rounded-lg transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2"
          data-testid="run-pyspark-btn"
        >
          {pysparkLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-secondary-foreground border-t-transparent rounded-full animate-spin"></div>
              Processing...
            </>
          ) : (
            <>
              <Play size={16} />
              Run Transformation
            </>
          )}
        </button>

        {/* PySpark Results */}
        {pysparkResult && pysparkResult.success && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 space-y-4"
          >
            {/* Code */}
            <div>
              <h3 className="text-sm font-medium mb-2">PySpark Code:</h3>
              <div className="bg-background rounded-lg p-4">
                <pre className="text-xs font-mono text-muted-foreground">
                  {pysparkResult.code}
                </pre>
              </div>
            </div>

            {/* Results */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle className="text-success" size={20} />
                <span className="text-sm font-medium">Transformation Results</span>
              </div>
              <div className="bg-background rounded-lg p-4 max-h-96 overflow-auto">
                <pre className="text-xs font-mono">
                  {JSON.stringify(pysparkResult.data, null, 2)}
                </pre>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Info Section */}
      <div className="bg-card border border-primary/30 rounded-lg p-6">
        <h3 className="text-lg font-bold mb-3">About This Demo</h3>
        <div className="space-y-2 text-sm text-muted-foreground">
          <p>
            <strong className="text-foreground">SQL Query Executor:</strong> Execute SQL-like queries on MongoDB data. 
            This demonstrates data retrieval and basic analytics capabilities.
          </p>
          <p>
            <strong className="text-foreground">PySpark Transformations:</strong> Run distributed data processing operations 
            using Apache Spark. This showcases scalable data analytics for large datasets.
          </p>
          <p className="text-xs text-muted-foreground">
            Note: This is a demonstration environment. In production, these operations would be optimized 
            for handling millions of transactions across distributed clusters.
          </p>
        </div>
      </div>
    </motion.div>
  );
};

export default DataProcessing;
