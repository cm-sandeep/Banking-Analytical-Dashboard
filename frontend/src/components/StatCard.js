import React from "react";
import { motion } from "framer-motion";

export const StatCard = ({ title, value, subtitle, icon: Icon, trend, color = "primary" }) => {
  const colorClasses = {
    primary: "from-primary/10",
    success: "from-success/10",
    warning: "from-warning/10",
    destructive: "from-destructive/10",
    secondary: "from-secondary/10",
  };

  const iconColorClasses = {
    primary: "text-primary",
    success: "text-success",
    warning: "text-warning",
    destructive: "text-destructive",
    secondary: "text-secondary",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`
        bg-card border border-white/10 rounded-lg p-6
        hover:border-primary/50 transition-all duration-300
        bg-gradient-to-br ${colorClasses[color]} to-transparent
      `}
      data-testid={`stat-card-${title.toLowerCase().replace(/\s+/g, '-')}`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-muted-foreground mb-2">{title}</p>
          <h3 className="text-3xl font-bold mb-1">{value}</h3>
          {subtitle && (
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          )}
          {trend && (
            <div className={`mt-2 text-xs font-medium ${
              trend.direction === 'up' ? 'text-success' : 'text-destructive'
            }`}>
              {trend.direction === 'up' ? '↑' : '↓'} {trend.value}
            </div>
          )}
        </div>
        {Icon && (
          <div className={`p-3 rounded-lg bg-muted/50 ${iconColorClasses[color]}`}>
            <Icon size={24} />
          </div>
        )}
      </div>
    </motion.div>
  );
};
