import React from 'react';

export const Spinner = ({ size = 'md', className = '' }) => {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  return (
    <div className={`flex justify-center items-center ${className}`}>
      <div className={`animate-spin rounded-full border-2 border-primary/20 border-t-primary ${sizes[size]}`}></div>
    </div>
  );
};

export const CardSkeleton = ({ className = '' }) => {
  return (
    <div className={`glass-card p-6 space-y-4 animate-pulse ${className}`}>
      <div className="h-4 bg-surface-container-highest rounded w-1/3"></div>
      <div className="space-y-2">
        <div className="h-8 bg-surface-container-highest rounded w-2/3"></div>
        <div className="h-4 bg-surface-container-highest rounded w-1/2"></div>
      </div>
    </div>
  );
};

export const TableSkeleton = ({ rows = 5, cols = 4, className = '' }) => {
  return (
    <div className={`w-full glass-card p-6 animate-pulse ${className}`}>
      <div className="h-6 bg-surface-container-highest rounded w-1/4 mb-6"></div>
      <div className="space-y-4">
        {Array.from({ length: rows }).map((_, rIdx) => (
          <div key={rIdx} className="flex gap-4 border-b border-white/5 pb-4">
            {Array.from({ length: cols }).map((_, cIdx) => (
              <div key={cIdx} className={`h-4 bg-surface-container-highest rounded flex-1 ${cIdx === 0 ? 'w-2/3' : ''}`}></div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export const ChartSkeleton = ({ className = '' }) => {
  return (
    <div className={`glass-card p-6 animate-pulse h-64 flex flex-col justify-between ${className}`}>
      <div className="h-4 bg-surface-container-highest rounded w-1/4"></div>
      <div className="flex items-end gap-3 h-40">
        <div className="h-12 bg-surface-container-highest rounded flex-1"></div>
        <div className="h-28 bg-surface-container-highest rounded flex-1"></div>
        <div className="h-20 bg-surface-container-highest rounded flex-1"></div>
        <div className="h-36 bg-surface-container-highest rounded flex-1"></div>
        <div className="h-16 bg-surface-container-highest rounded flex-1"></div>
        <div className="h-32 bg-surface-container-highest rounded flex-1"></div>
      </div>
      <div className="h-4 bg-surface-container-highest rounded w-2/3 mt-2"></div>
    </div>
  );
};

const Loader = ({ variant = 'spinner', ...props }) => {
  if (variant === 'card') return <CardSkeleton {...props} />;
  if (variant === 'table') return <TableSkeleton {...props} />;
  if (variant === 'chart') return <ChartSkeleton {...props} />;
  return <Spinner {...props} />;
};

export default Loader;
