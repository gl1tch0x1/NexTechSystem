'use client';

import { useEffect } from 'react';

/**
 * Security Deterrent Component
 * - Disables right-click context menu (Inspect)
 * - Intercepts and disables DevTools inspection key combinations (F12, Ctrl+Shift+I, etc.)
 * - Hardens application integrity against client-side source inspection
 */
export default function SecurityDeterrent() {
  useEffect(() => {
    // 1. Disable Right-Click Context Menu
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      return false;
    };

    // 2. Disable DevTools & Inspect Keyboard Shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform);
      const cmdOrCtrl = isMac ? e.metaKey : e.ctrlKey;

      // F12 key (DevTools standard shortcut)
      if (e.key === 'F12' || e.keyCode === 123) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }

      // Ctrl+Shift+I or Cmd+Option+I (Inspect Elements)
      if (cmdOrCtrl && (e.shiftKey || (isMac && e.altKey)) && (e.key === 'I' || e.key === 'i' || e.keyCode === 73)) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }

      // Ctrl+Shift+J or Cmd+Option+J (Console)
      if (cmdOrCtrl && (e.shiftKey || (isMac && e.altKey)) && (e.key === 'J' || e.key === 'j' || e.keyCode === 74)) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }

      // Ctrl+Shift+C or Cmd+Option+C (Inspect Element Picker)
      if (cmdOrCtrl && (e.shiftKey || (isMac && e.altKey)) && (e.key === 'C' || e.key === 'c' || e.keyCode === 67)) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }

      // Ctrl+U or Cmd+Option+U (View Source)
      if (cmdOrCtrl && (e.key === 'U' || e.key === 'u' || e.keyCode === 85)) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }

      // Ctrl+S or Cmd+S (Save Page Source)
      if (cmdOrCtrl && (e.key === 'S' || e.key === 's' || e.keyCode === 83)) {
        // Only block if not in an input/textarea
        const target = e.target as HTMLElement;
        if (target && !['INPUT', 'TEXTAREA'].includes(target.tagName)) {
          e.preventDefault();
          e.stopPropagation();
          return false;
        }
      }
    };

    // Attach listeners at window level with capturing
    window.addEventListener('contextmenu', handleContextMenu, { capture: true });
    window.addEventListener('keydown', handleKeyDown, { capture: true });

    return () => {
      window.removeEventListener('contextmenu', handleContextMenu, { capture: true });
      window.removeEventListener('keydown', handleKeyDown, { capture: true });
    };
  }, []);

  return null;
}
