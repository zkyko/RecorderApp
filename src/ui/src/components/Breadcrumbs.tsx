import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

export interface BreadcrumbItem {
  label: string;
  path?: string;
}

export interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
}

/**
 * Breadcrumb navigation component
 * Based on UI-update.md specifications
 * Added to all subpages with clickable segments
 */
const Breadcrumbs: React.FC<BreadcrumbsProps> = ({
  items,
  className = '',
}) => {
  const navigate = useNavigate();

  if (items.length === 0) return null;

  return (
    <nav
      className={`flex items-center gap-2 text-sm ${className}`}
      aria-label="Breadcrumb"
    >
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        const isClickable = item.path && !isLast;

        return (
          <React.Fragment key={index}>
            {isClickable ? (
              <button
                onClick={() => item.path && navigate(item.path)}
                className="text-base-content/70 hover:text-base-content transition-colors"
                aria-label={`Navigate to ${item.label}`}
              >
                {item.label}
              </button>
            ) : (
              <span
                className={isLast ? 'font-semibold text-base-content' : 'text-base-content/70'}
              >
                {item.label}
              </span>
            )}
            {!isLast && (
              <ChevronRight size={14} className="text-base-content/40" />
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
};

export default Breadcrumbs;
