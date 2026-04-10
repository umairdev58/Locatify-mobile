import React, { createContext, useContext, useMemo, useState } from 'react';

type TabKey = 'index' | 'two' | 'shared' | 'other';

type TabSearchState = {
  myLocQuery: string;
  pinLocQuery: string;
  sharedLocQuery: string;
  setMyLocQuery: (q: string) => void;
  setPinLocQuery: (q: string) => void;
  setSharedLocQuery: (q: string) => void;
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
  if (routeName === 'shared') return 'shared';
  return 'other';
}

export function TabSearchProvider({ children }: { children: React.ReactNode }) {
  const [myLocQuery, setMyLocQuery] = useState('');
  const [pinLocQuery, setPinLocQuery] = useState('');
  const [sharedLocQuery, setSharedLocQuery] = useState('');
  const [headerSearchOpen, setHeaderSearchOpen] = useState(false);

  const value = useMemo<TabSearchState>(() => {
    return {
      myLocQuery,
      pinLocQuery,
      sharedLocQuery,
      setMyLocQuery,
      setPinLocQuery,
      setSharedLocQuery,
      getQueryForRoute: (routeName: string) => {
        const key = routeToKey(routeName);
        if (key === 'index') return myLocQuery;
        if (key === 'two') return pinLocQuery;
        if (key === 'shared') return sharedLocQuery;
        return '';
      },
      setQueryForRoute: (routeName: string, q: string) => {
        const key = routeToKey(routeName);
        if (key === 'index') setMyLocQuery(q);
        else if (key === 'two') setPinLocQuery(q);
        else if (key === 'shared') setSharedLocQuery(q);
      },
      headerSearchOpen,
      setHeaderSearchOpen,
    };
  }, [myLocQuery, pinLocQuery, sharedLocQuery, headerSearchOpen]);

  return <TabSearchContext.Provider value={value}>{children}</TabSearchContext.Provider>;
}

export function useTabSearch() {
  const ctx = useContext(TabSearchContext);
  if (!ctx) throw new Error('useTabSearch must be used within TabSearchProvider');
  return ctx;
}

