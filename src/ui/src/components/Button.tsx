import React from 'react';
import { LucideIcon } from 'lucide-react';

export type ButtonVariant = 'primary' | 'secondary' | 'tertiary' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: LucideIcon;
  iconPosition?: 'left' | 'right';
  tooltip?: string;
  loading?: boolean;
  children?: React.ReactNode;
}

/**
 * Reusable Button component with consistent styling
 * Based on UI-update.md button hierarchy system
 */
const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  icon: Icon,
  iconPosition = 'left',
  tooltip,
  loading = false,
  disabled,
  className = '',
  children,
  ...props
}) => {
  const getVariantClasses = () => {
    switch (variant) {
      case 'primary':
        return 'bg-[#4C6EF5] text-white hover:brightness-110 border-transparent';
      case 'secondary':
        return 'bg-transparent text-[#4C6EF5] border-[#4C6EF5] hover:bg-[#4C6EF5]/10';
      case 'tertiary':
        return 'bg-transparent text-base-content/70 hover:bg-base-200 hover:text-base-content border-transparent';
      case 'danger':
        return 'bg-[#FA5252] text-white hover:brightness-110 border-transparent';
      default:
        return '';
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'px-3 py-1.5 text-sm min-h-[32px]';
      case 'md':
        return 'px-3 py-2 text-sm min-h-[36px]';
      case 'lg':
        return 'px-4 py-2.5 text-base min-h-[40px]';
      default:
        return '';
    }
  };

  const baseClasses = `
    inline-flex items-center justify-center gap-2
    font-medium rounded-md
    transition-all duration-200
    focus:outline-none focus:ring-2 focus:ring-[#4C6EF5] focus:ring-offset-2
    disabled:opacity-50 disabled:cursor-not-allowed
    ${getVariantClasses()}
    ${getSizeClasses()}
    ${className}
  `.trim().replace(/\s+/g, ' ');

  const buttonContent = (
    <>
      {loading && (
        <svg
          className="animate-spin h-4 w-4"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}
      {Icon && iconPosition === 'left' && !loading && <Icon size={16} />}
      {children && <span>{children}</span>}
      {Icon && iconPosition === 'right' && !loading && <Icon size={16} />}
    </>
  );

  const button = (
    <button
      className={baseClasses}
      disabled={disabled || loading}
      aria-label={tooltip || (typeof children === 'string' ? children : undefined)}
      {...props}
    >
      {buttonContent}
    </button>
  );

  // Wrap with tooltip if provided and variant is tertiary (icon-only)
  if (tooltip && (variant === 'tertiary' || !children)) {
    return (
      <div className="tooltip tooltip-bottom" data-tip={tooltip}>
        {button}
      </div>
    );
  }

  return button;
};

export default Button;
