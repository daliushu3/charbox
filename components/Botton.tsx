
import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  size?: 'sm' | 'md' | 'lg';
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  className = '', 
  ...props 
}) => {
  const baseStyles = "inline-flex items-center justify-center font-mono font-bold transition-all duration-200 uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variants = {
    primary: "bg-cyan-600 hover:bg-cyan-500 text-white border-b-4 border-cyan-800 active:border-b-0 active:translate-y-[2px]",
    secondary: "bg-slate-700 hover:bg-slate-600 text-slate-100 border-b-4 border-slate-900 active:border-b-0 active:translate-y-[2px]",
    outline: "border-2 border-cyan-500/50 hover:border-cyan-400 text-cyan-400 hover:bg-cyan-500/10",
    danger: "bg-red-900/40 hover:bg-red-800/60 text-red-400 border border-red-500/50"
  };

  const sizes = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-5 py-2.5 text-sm",
    lg: "px-8 py-4 text-base"
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};
