import React, { createContext, useContext, useMemo, useState } from 'react';

type TabKey = 'index' | 'two' | 'other';

type TabSearchState = {
  myLocQuery: string;
  pinLocQuery: string;
  setMyLocQuery: (q: string) => void;
  setPinLocQuery: (q: string) => void;
  getQueryForRoute: (routeName: string) => string;
  setQueryForRoute: (routeName: string, q: string) => void;
  /** Expandable header search (icon → field) */
  headerSearchOpen: boolean;
  setHeaderSearchOpen: (open: boolean) => void;
};

const TabSearchContext = createContext<TabSearchState | null>(null);

function routeToKey(routeName: string): TabKey {
  if (routeName === 'index') return 'index';
  if (routeName === 'two') return 'two';
  return 'other';
}

export function TabSearchProvider({ children }: { children: React.ReactNode }) {
  const [myLocQuery, setMyLocQuery] = useState('');
  const [pinLocQuery, setPinLocQuery] = useState('');
  const [headerSearchOpen, setHeaderSearchOpen] = useState(false);

  const value = useMemo<TabSearchState>(() => {
    return {
      myLocQuery,
      pinLocQuery,
      setMyLocQuery,
      setPinLocQuery,
      getQueryForRoute: (routeName: string) => {
        const key = routeToKey(routeName);
        if (key === 'index') return myLocQuery;
        if (key === 'two') return pinLocQuery;
        return '';
      },
      setQueryForRoute: (routeName: string, q: string) => {
        const key = routeToKey(routeName);
        if (key === 'index') setMyLocQuery(q);
        else if (key === 'two') setPinLocQuery(q);
      },
      headerSearchOpen,
      setHeaderSearchOpen,
    };
  }, [myLocQuery, pinLocQuery, headerSearchOpen]);

  return <TabSearchContext.Provider value={value}>{children}</TabSearchContext.Provider>;
}

export function useTabSearch() {
  const ctx = useContext(TabSearchContext);
  if (!ctx) throw new Error('useTabSearch must be used within TabSearchProvider');
  return ctx;
}

