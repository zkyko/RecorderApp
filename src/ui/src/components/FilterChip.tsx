import React from 'react';
import { X } from 'lucide-react';

export interface FilterChipProps {
  label: string;
  active?: boolean;
  count?: number;
  onToggle: () => void;
  removable?: boolean;
  onRemove?: () => void;
  className?: string;
}

/**
 * Filter chip component for consistent filtering UI
 * Based on UI-update.md specifications
 * Used across Test Library, Test Runs, and other filtered screens
 */
const FilterChip: React.FC<FilterChipProps> = ({
  label,
  active = false,
  count,
  onToggle,
  removable = false,
  onRemove,
  className = '',
}) => {
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (removable && onRemove) {
      onRemove();
    } else {
      onToggle();
    }
  };

  return (
    <button
      className={`
        inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium
        transition-all duration-200
        ${active
          ? 'bg-[#4C6EF5] text-white border border-[#4C6EF5]'
          : 'bg-base-200 text-base-content border border-base-300 hover:bg-base-300'
        }
        ${className}
      `.trim().replace(/\s+/g, ' ')}
      onClick={handleClick}
      aria-label={`Filter: ${label}${count !== undefined ? ` (${count})` : ''}${active ? ' (active)' : ''}`}
      aria-pressed={active}
    >
      <span>{label}</span>
      {count !== undefined && (
        <span className={`
          px-1.5 py-0.5 rounded-full text-xs
          ${active ? 'bg-white/20' : 'bg-base-300'}
        `.trim()}>
          {count}
        </span>
      )}
      {removable && (
        <X
          size={14}
          className="ml-0.5"
          onClick={(e) => {
            e.stopPropagation();
            if (onRemove) {
              onRemove();
            }
          }}
        />
      )}
    </button>
  );
};

export default FilterChip;
