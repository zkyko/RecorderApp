import React from 'react';

export interface ProgressBarProps {
  value: number; // 0-100
  max?: number;
  label?: string;
  showPercentage?: boolean;
  color?: 'primary' | 'success' | 'warning' | 'error';
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Progress bar component for multi-step operations
 * Based on UI-update.md specifications
 */
const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  max = 100,
  label,
  showPercentage = true,
  color = 'primary',
  className = '',
  size = 'md',
}) => {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  const getColorClasses = () => {
    switch (color) {
      case 'primary':
        return 'bg-[#4C6EF5]';
      case 'success':
        return 'bg-[#2B8A3E]';
      case 'warning':
        return 'bg-[#E67700]';
      case 'error':
        return 'bg-[#FA5252]';
      default:
        return 'bg-[#4C6EF5]';
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'h-1';
      case 'md':
        return 'h-2';
      case 'lg':
        return 'h-3';
      default:
        return 'h-2';
    }
  };

  return (
    <div className={`w-full ${className}`}>
      {(label || showPercentage) && (
        <div className="flex justify-between items-center mb-1">
          {label && <span className="text-sm text-base-content/70">{label}</span>}
          {showPercentage && (
            <span className="text-sm text-base-content/70">{Math.round(percentage)}%</span>
          )}
        </div>
      )}
      <div
        className={`w-full bg-base-300 rounded-full overflow-hidden ${getSizeClasses()}`}
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-label={label || `Progress: ${Math.round(percentage)}%`}
      >
        <div
          className={`h-full transition-all duration-300 ease-out ${getColorClasses()}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

export default ProgressBar;
