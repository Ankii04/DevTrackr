import React from 'react';

const Badge = ({ 
  children, 
  variant = 'info', 
  className = '' 
}) => {
  const baseStyle = 'inline-flex items-center px-2.5 py-0.5 rounded-full font-mono text-[11px] font-semibold border tracking-wide uppercase';
  
  const variants = {
    info: 'bg-primary-container/10 text-primary border-primary/20',
    success: 'bg-secondary-container/10 text-secondary border-secondary/20',
    warning: 'bg-tertiary-container/10 text-tertiary border-tertiary/20',
    danger: 'bg-error-container/10 text-error border-error/20',
    neutral: 'bg-surface-container-highest text-on-surface-variant border-outline-variant'
  };

  return (
    <span className={`${baseStyle} ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
};

export default Badge;
