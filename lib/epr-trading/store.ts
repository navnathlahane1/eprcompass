// [MODULE] Trading State Management
// [PURPOSE] Lightweight trading state hook for order book and negotiation UI without global dependency churn.
// [DEPENDENCIES] react, ./types

'use client';

import { useMemo, useState } from 'react';
import type { MatchCandidate, NegotiationMessage, NegotiationRoom, TradingOrder } from './types';

export interface TradingState {
  orders: TradingOrder[];
  selectedOrderId: string | null;
  matches: MatchCandidate[];
  activeRoom: NegotiationRoom | null;
  messages: NegotiationMessage[];
}

const initialState: TradingState = {
  orders: [],
  selectedOrderId: null,
  matches: [],
  activeRoom: null,
  messages: []
};

export function useTradingState() {
  const [state, setState] = useState<TradingState>(initialState);

  const api = useMemo(
    () => ({
      setOrders: (orders: TradingOrder[]) => {
        setState((prev) => ({ ...prev, orders }));
      },
      selectOrder: (orderId: string | null) => {
        setState((prev) => ({ ...prev, selectedOrderId: orderId }));
      },
      setMatches: (matches: MatchCandidate[]) => {
        setState((prev) => ({ ...prev, matches }));
      },
      setRoom: (room: NegotiationRoom | null) => {
        setState((prev) => ({ ...prev, activeRoom: room }));
      },
      appendMessage: (message: NegotiationMessage) => {
        setState((prev) => ({ ...prev, messages: [...prev.messages, message] }));
      },
      resetTrading: () => {
        setState(initialState);
      }
    }),
    []
  );

  return {
    state,
    ...api
  };
}
