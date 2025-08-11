import React from 'react';

interface ButtonProps {
  children: React.ReactNode;
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
  onClick?: (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
  className?: string;
}

const Button: React.FC<ButtonProps> = ({ 
  children, 
  type = 'button',
  disabled = false, 
  onClick, 
  className = '' 
}) => {
  const baseClasses = 'px-5 py-3 rounded-lg font-medium transition-all duration-300 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed';
  
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`${baseClasses} border-2 border-secondary-200 hover:bg-secondary-50 hover:border-orange-400 focus:ring-orange-400 bg-white ${className} `}
    >
      {children}
    </button>
  );
};

export default Button; 