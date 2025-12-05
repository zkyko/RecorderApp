import React, { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { Card, Text, Group, ActionIcon, Button } from '@mantine/core';
import { Lightbulb, X, ChevronLeft, ChevronRight } from 'lucide-react';
import './HintPanel.css';
import { HINTS_BY_ROUTE } from '../data/hints';

const HintPanel: React.FC = () => {
  const location = useLocation();
  const [currentHintIndex, setCurrentHintIndex] = useState(0);
  const [isDismissed, setIsDismissed] = useState(false);
  const [dismissedHints, setDismissedHints] = useState<Set<string>>(new Set());

  // Get hints for current route
  const hints = useMemo(() => {
    const path = location.pathname;
    
    // Match route patterns
    if (path === '/' || path === '/dashboard') {
      return HINTS_BY_ROUTE.dashboard;
    } else if (path === '/library') {
      return HINTS_BY_ROUTE.library;
    } else if (path.startsWith('/record')) {
      if (path === '/record/step-editor') {
        return HINTS_BY_ROUTE.stepEditor;
      } else if (path === '/record/locator-cleanup') {
        return HINTS_BY_ROUTE.locatorCleanup;
      } else if (path === '/record/params' || path.includes('/params')) {
        return HINTS_BY_ROUTE.parameterMapping;
      } else {
        return HINTS_BY_ROUTE.record;
      }
    } else if (path.startsWith('/runs')) {
      return HINTS_BY_ROUTE.runs;
    } else if (path.startsWith('/report')) {
      return HINTS_BY_ROUTE.report;
    } else if (path === '/locators') {
      return HINTS_BY_ROUTE.locators;
    } else if (path === '/settings') {
      return HINTS_BY_ROUTE.settings;
    }
    
    return [];
  }, [location.pathname]);

  // Get available hints (not dismissed) and track their original indices
  const availableHints = useMemo(() => {
    return hints
      .map((hint, originalIndex) => ({ hint, originalIndex }))
      .filter(({ originalIndex }) => {
        const hintKey = `${location.pathname}-${originalIndex}`;
        return !dismissedHints.has(hintKey);
      });
  }, [hints, location.pathname, dismissedHints]);

  // Reset hint index when route changes
  useEffect(() => {
    setCurrentHintIndex(0);
    setIsDismissed(false);
  }, [location.pathname]);

  // Reset index if it's out of bounds for available hints
  useEffect(() => {
    if (availableHints.length > 0 && currentHintIndex >= availableHints.length) {
      setCurrentHintIndex(0);
    }
  }, [availableHints.length, currentHintIndex]);

  // Auto-rotate hints every 15 seconds (only rotate through available hints)
  useEffect(() => {
    if (isDismissed || availableHints.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentHintIndex((prev) => (prev + 1) % availableHints.length);
    }, 15000);

    return () => clearInterval(interval);
  }, [availableHints.length, isDismissed]);

  // Get current hint from available hints
  const currentHint = availableHints.length > 0 
    ? availableHints[currentHintIndex % availableHints.length]?.hint
    : null;

  if (isDismissed || !currentHint || availableHints.length === 0) {
    // Show a collapsed "Show hints" button if dismissed
    if (isDismissed && hints.length > 0) {
      return (
        <div className="hint-panel-collapsed">
          <Button
            size="xs"
            variant="subtle"
            leftSection={<Lightbulb size={14} />}
            onClick={() => setIsDismissed(false)}
          >
            Show Tips
          </Button>
        </div>
      );
    }
    return null;
  }

  const handleDismiss = () => {
    const currentHintData = availableHints[currentHintIndex % availableHints.length];
    if (currentHintData) {
      const hintKey = `${location.pathname}-${currentHintData.originalIndex}`;
      setDismissedHints((prev) => new Set(prev).add(hintKey));
      // Move to next hint if available
      if (availableHints.length > 1) {
        setCurrentHintIndex((prev) => prev % (availableHints.length - 1));
      } else {
        setIsDismissed(true);
      }
    }
  };

  const handlePrevious = () => {
    setCurrentHintIndex((prev) => (prev - 1 + availableHints.length) % availableHints.length);
  };

  const handleNext = () => {
    setCurrentHintIndex((prev) => (prev + 1) % availableHints.length);
  };

  return (
    <div className="hint-panel">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2 flex-1">
          <Lightbulb size={14} className="text-info mt-0.5 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="text-xs font-medium text-base-content mb-0.5">
              {currentHint.title}
            </div>
            <div className="text-xs text-base-content/60 leading-snug">
              {currentHint.message}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          {availableHints.length > 1 && (
            <>
              <button
                className="btn btn-ghost btn-xs p-1"
                onClick={handlePrevious}
                disabled={availableHints.length <= 1}
                title="Previous tip"
              >
                <ChevronLeft size={12} />
              </button>
              <span className="text-xs text-base-content/50 px-1">
                {currentHintIndex + 1}/{availableHints.length}
              </span>
              <button
                className="btn btn-ghost btn-xs p-1"
                onClick={handleNext}
                disabled={availableHints.length <= 1}
                title="Next tip"
              >
                <ChevronRight size={12} />
              </button>
            </>
          )}
          <button
            className="btn btn-ghost btn-xs p-1"
            onClick={handleDismiss}
            title="Dismiss tip"
          >
            <X size={12} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default HintPanel;
