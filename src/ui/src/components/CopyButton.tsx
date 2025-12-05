import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { notifications } from '../utils/notifications';

export interface CopyButtonProps {
  text: string;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'ghost' | 'outline' | 'icon';
  className?: string;
  onCopy?: () => void;
}

/**
 * Copy button component with success toast
 * Based on UI-update.md specifications
 * Shows checkmark icon on success
 */
const CopyButton: React.FC<CopyButtonProps> = ({
  text,
  label = 'Copy',
  size = 'md',
  variant = 'icon',
  className = '',
  onCopy,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      
      notifications.show({
        message: 'Copied to clipboard',
        color: 'success',
        autoClose: 2000,
      });

      if (onCopy) {
        onCopy();
      }

      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
      notifications.show({
        message: 'Failed to copy to clipboard',
        color: 'error',
        autoClose: 3000,
      });
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'btn-xs';
      case 'md':
        return 'btn-sm';
      case 'lg':
        return 'btn-md';
      default:
        return 'btn-sm';
    }
  };

  const getVariantClasses = () => {
    switch (variant) {
      case 'ghost':
        return 'btn-ghost';
      case 'outline':
        return 'btn-outline';
      case 'icon':
      default:
        return 'btn-ghost';
    }
  };

  if (variant === 'icon') {
    return (
      <button
        className={`btn ${getSizeClasses()} ${getVariantClasses()} ${className}`}
        onClick={handleCopy}
        aria-label={copied ? 'Copied!' : `Copy ${label}`}
        title={copied ? 'Copied!' : `Copy ${label}`}
      >
        {copied ? (
          <Check size={16} className="text-success" />
        ) : (
          <Copy size={16} />
        )}
      </button>
    );
  }

  return (
    <button
      className={`btn ${getSizeClasses()} ${getVariantClasses()} ${className}`}
      onClick={handleCopy}
      aria-label={copied ? 'Copied!' : `Copy ${label}`}
    >
      {copied ? (
        <>
          <Check size={16} className="text-success" />
          Copied
        </>
      ) : (
        <>
          <Copy size={16} />
          {label}
        </>
      )}
    </button>
  );
};

export default CopyButton;
