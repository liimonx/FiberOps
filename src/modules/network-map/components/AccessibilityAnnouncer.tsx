"use client";

import React, { useState, useEffect, useCallback, createContext, useContext } from 'react';

interface Announcement {
  id: string;
  message: string;
  priority: 'polite' | 'assertive';
}

interface AccessibilityContextType {
  announce: (message: string, priority?: 'polite' | 'assertive') => void;
}

const AccessibilityContext = createContext<AccessibilityContextType>({
  announce: () => {},
});

export const useAccessibilityAnnounce = () => useContext(AccessibilityContext);

export const AccessibilityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);

  const announce = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    const id = `${Date.now()}-${Math.random()}`;
    setAnnouncements(prev => [...prev, { id, message, priority }]);

    // Remove announcement after screen reader has had time to read it
    setTimeout(() => {
      setAnnouncements(prev => prev.filter(a => a.id !== id));
    }, 1000);
  }, []);

  return (
    <AccessibilityContext.Provider value={{ announce }}>
      {children}
      {/* Live region for polite announcements */}
      <div
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
        style={{
          position: 'absolute',
          width: '1px',
          height: '1px',
          padding: '0',
          margin: '-1px',
          overflow: 'hidden',
          clip: 'rect(0, 0, 0, 0)',
          whiteSpace: 'nowrap',
          border: '0',
        }}
      >
        {announcements
          .filter(a => a.priority === 'polite')
          .map(a => a.message)
          .join(' ')}
      </div>
      {/* Live region for assertive announcements */}
      <div
        aria-live="assertive"
        aria-atomic="true"
        className="sr-only"
        style={{
          position: 'absolute',
          width: '1px',
          height: '1px',
          padding: '0',
          margin: '-1px',
          overflow: 'hidden',
          clip: 'rect(0, 0, 0, 0)',
          whiteSpace: 'nowrap',
          border: '0',
        }}
      >
        {announcements
          .filter(a => a.priority === 'assertive')
          .map(a => a.message)
          .join(' ')}
      </div>
    </AccessibilityContext.Provider>
  );
};

// Hook to announce state changes
export const useAnnounceStateChange = (
  message: string,
  deps: React.DependencyList,
  priority: 'polite' | 'assertive' = 'polite'
) => {
  const { announce } = useAccessibilityAnnounce();

  useEffect(() => {
    announce(message, priority);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
};
