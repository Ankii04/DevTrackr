import React from 'react';

const StatCard = ({ 
  title, 
  value, 
  delta = null, 
  icon, 
  color = 'blue' // blue, green, amber, red
}) => {

  const colorStyles = {
    blue: {
      text: 'text-primary',
      bg: 'bg-primary-container/10 border-primary/10',
      iconBg: 'bg-primary-container/20 text-primary-fixed-dim'
    },
    green: {
      text: 'text-secondary',
      bg: 'bg-secondary-container/10 border-secondary/10',
      iconBg: 'bg-secondary-container/20 text-secondary-fixed-dim'
    },
    amber: {
      text: 'text-tertiary',
      bg: 'bg-tertiary-container/10 border-tertiary/10',
      iconBg: 'bg-tertiary-container/20 text-tertiary-fixed-dim'
    },
    red: {
      text: 'text-error',
      bg: 'bg-error-container/10 border-error/10',
      iconBg: 'bg-error-container/20 text-error'
    }
  };

  const style = colorStyles[color] || colorStyles.blue;

  return (
    <div className={`glass-card glass-card-hover p-6 border ${style.bg}`}>
      <div className="flex justify-between items-start">
        <div className="space-y-2">
          <p className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider">{title}</p>
          <h3 className="font-numeric-sm text-headline-md text-on-surface font-semibold tracking-tight">{value}</h3>
        </div>
        {icon && (
          <div className={`p-2.5 rounded-lg flex items-center justify-center ${style.iconBg}`}>
            <span className="material-symbols-outlined text-[22px]">{icon}</span>
          </div>
        )}
      </div>
      
      {delta !== null && (
        <div className="mt-4 flex items-center gap-1.5 text-[12px]">
          <span className={`font-mono font-semibold flex items-center ${delta >= 0 ? 'text-secondary' : 'text-error'}`}>
            <span className="material-symbols-outlined text-[16px] mr-0.5">
              {delta >= 0 ? 'trending_up' : 'trending_down'}
            </span>
            {delta >= 0 ? `+${delta}%` : `${delta}%`}
          </span>
          <span className="text-on-surface-variant font-outfit">vs last week</span>
        </div>
      )}
    </div>
  );
};

export default StatCard;
