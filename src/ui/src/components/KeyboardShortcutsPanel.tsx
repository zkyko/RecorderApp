import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { useKeyboardShortcuts, KeyboardShortcut } from '../hooks/useKeyboardShortcuts';

export interface KeyboardShortcutsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  shortcuts?: KeyboardShortcut[];
}

/**
 * Keyboard shortcuts panel modal
 * Based on UI-update.md specifications
 * Shows all available keyboard shortcuts
 */
const KeyboardShortcutsPanel: React.FC<KeyboardShortcutsPanelProps> = ({
  isOpen,
  onClose,
  shortcuts = [],
}) => {
  // Close on Escape key
  useKeyboardShortcuts([
    {
      key: 'Escape',
      handler: () => {
        if (isOpen) {
          onClose();
        }
      },
      global: true,
    },
  ]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  const modifierKey = isMac ? '⌘' : 'Ctrl';

  const formatShortcut = (shortcut: KeyboardShortcut): string => {
    const parts: string[] = [];
    if (shortcut.ctrlKey || shortcut.metaKey) {
      parts.push(modifierKey);
    }
    if (shortcut.shiftKey) {
      parts.push('Shift');
    }
    if (shortcut.altKey) {
      parts.push('Alt');
    }
    parts.push(shortcut.key.toUpperCase());
    return parts.join(' + ');
  };

  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 z-50"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="bg-base-200 border border-base-300 rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between p-6 border-b border-base-300">
            <h2 className="text-xl font-semibold">Keyboard Shortcuts</h2>
            <button
              className="btn btn-ghost btn-sm"
              onClick={onClose}
              aria-label="Close shortcuts panel"
            >
              <X size={20} />
            </button>
          </div>
          <div className="overflow-y-auto flex-1 p-6">
            {shortcuts.length === 0 ? (
              <p className="text-base-content/60">No shortcuts available</p>
            ) : (
              <div className="space-y-4">
                {shortcuts.map((shortcut, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between py-2 border-b border-base-300 last:border-0"
                  >
                    <div className="flex-1">
                      {shortcut.description && (
                        <div className="text-sm font-medium text-base-content">
                          {shortcut.description}
                        </div>
                      )}
                    </div>
                    <kbd className="px-3 py-1.5 bg-base-300 border border-base-content/20 rounded text-sm font-mono">
                      {formatShortcut(shortcut)}
                    </kbd>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="p-4 border-t border-base-300 text-sm text-base-content/60 text-center">
            Press <kbd className="px-2 py-1 bg-base-300 rounded text-xs">Esc</kbd> to close
          </div>
        </div>
      </div>
    </>
  );
};

export default KeyboardShortcutsPanel;
