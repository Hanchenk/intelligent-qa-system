'use client';

import { useRef } from 'react';
import { Provider } from 'react-redux';
import { store } from './store/index';

export default function ReduxProvider({ children }) {
  const storeRef = useRef(store);
  
  return <Provider store={storeRef.current}>{children}</Provider>;
} 