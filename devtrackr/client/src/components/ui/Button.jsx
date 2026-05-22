import React from 'react';

const Button = ({ 
  children, 
  onClick, 
  type = 'button', 
  variant = 'primary', 
  disabled = false, 
  loading = false,
  className = '' 
}) => {
  
  const baseStyle = 'relative inline-flex items-center justify-center font-outfit rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-150 active:scale-95 disabled:scale-100 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variants = {
    primary: 'bg-primary-container text-on-primary-container hover:bg-primary-container/85 focus:ring-primary focus:ring-offset-background electric-glow',
    secondary: 'bg-secondary-container text-on-secondary-container hover:bg-secondary-container/85 focus:ring-secondary focus:ring-offset-background',
    outline: 'bg-transparent border border-outline text-on-surface hover:bg-surface-variant focus:ring-outline focus:ring-offset-background',
    danger: 'bg-error-container text-on-error-container hover:bg-error-container/85 focus:ring-error focus:ring-offset-background',
    ghost: 'bg-transparent text-on-surface-variant hover:text-on-surface hover:bg-surface-variant/40'
  };

  const sizes = 'px-4 py-2.5 text-[14px] font-semibold';

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`${baseStyle} ${variants[variant]} ${sizes} ${className}`}
    >
      {loading ? (
        <>
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span>Loading...</span>
        </>
      ) : children}
    </button>
  );
};

export default Button;
