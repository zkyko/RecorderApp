import { useEffect, useCallback } from 'react';

export interface KeyboardShortcut {
  key: string;
  ctrlKey?: boolean;
  metaKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  handler: () => void;
  description?: string;
  global?: boolean; // If true, works even when inputs are focused
}

/**
 * Hook for managing keyboard shortcuts
 * Based on UI-update.md specifications
 */
export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[]) {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      shortcuts.forEach((shortcut) => {
        const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
        const ctrlOrMeta = isMac ? event.metaKey : event.ctrlKey;

        // Check if this shortcut matches
        const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase();
        const ctrlMatch = shortcut.ctrlKey !== undefined ? ctrlOrMeta === shortcut.ctrlKey : true;
        const metaMatch = shortcut.metaKey !== undefined ? event.metaKey === shortcut.metaKey : true;
        const shiftMatch = shortcut.shiftKey !== undefined ? event.shiftKey === shortcut.shiftKey : true;
        const altMatch = shortcut.altKey !== undefined ? event.altKey === shortcut.altKey : true;

        // Check if we should ignore this (e.g., when typing in input)
        const isInputFocused =
          event.target instanceof HTMLInputElement ||
          event.target instanceof HTMLTextAreaElement ||
          (event.target instanceof HTMLElement && event.target.isContentEditable);

        if (
          keyMatch &&
          ctrlMatch &&
          metaMatch &&
          shiftMatch &&
          altMatch &&
          (shortcut.global || !isInputFocused)
        ) {
          event.preventDefault();
          shortcut.handler();
        }
      });
    },
    [shortcuts]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);
}

/**
 * Predefined keyboard shortcuts based on UI-update.md
 */
export const DEFAULT_SHORTCUTS: KeyboardShortcut[] = [
  {
    key: 'k',
    ctrlKey: true,
    description: 'Global search',
    global: true,
  },
  {
    key: 'r',
    ctrlKey: true,
    description: 'Start recording',
    global: true,
  },
  {
    key: 's',
    ctrlKey: true,
    description: 'Save/Stop',
    global: true,
  },
  {
    key: 'b',
    ctrlKey: true,
    description: 'Run tests',
    global: true,
  },
  {
    key: ',',
    ctrlKey: true,
    description: 'Open settings',
    global: true,
  },
  {
    key: 'Escape',
    description: 'Close modals/dismiss notifications',
    global: true,
  },
  {
    key: '?',
    description: 'Show shortcuts panel',
    global: true,
  },
];
