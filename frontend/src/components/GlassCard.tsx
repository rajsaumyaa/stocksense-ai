import React from 'react';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  className = '',
  title,
  subtitle,
  actions
}) => {
  return (
    <div className={`glass-card p-6 border border-white/20 dark:border-zinc-800/30 shadow-glass-light dark:shadow-glass-dark rounded-2xl ${className}`}>
      {(title || subtitle || actions) && (
        <div className="flex justify-between items-center mb-6">
          <div>
            {title && <h3 className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-white">{title}</h3>}
            {subtitle && <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">{subtitle}</p>}
          </div>
          {actions && <div className="flex items-center space-x-2">{actions}</div>}
        </div>
      )}
      {children}
    </div>
  );
};
export default GlassCard;
