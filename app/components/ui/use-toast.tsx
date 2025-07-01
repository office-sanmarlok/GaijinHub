import { useState, useEffect } from 'react';

export interface Toast {
  id: string;
  title?: string;
  description?: string;
  variant?: 'default' | 'destructive';
}

interface ToastState {
  toasts: Toast[];
}

const listeners: Array<(state: ToastState) => void> = [];
let memoryState: ToastState = { toasts: [] };

function dispatch(action: {
  type: 'ADD_TOAST' | 'UPDATE_TOAST' | 'DISMISS_TOAST' | 'REMOVE_TOAST';
  toast?: Toast;
  toastId?: string;
}) {
  memoryState = toastReducer(memoryState, action);
  listeners.forEach((listener) => {
    listener(memoryState);
  });
}

function toastReducer(
  state: ToastState,
  action: {
    type: 'ADD_TOAST' | 'UPDATE_TOAST' | 'DISMISS_TOAST' | 'REMOVE_TOAST';
    toast?: Toast;
    toastId?: string;
  }
): ToastState {
  switch (action.type) {
    case 'ADD_TOAST':
      return {
        ...state,
        toasts: [action.toast!, ...state.toasts],
      };

    case 'UPDATE_TOAST':
      return {
        ...state,
        toasts: state.toasts.map((t) => (t.id === action.toast!.id ? action.toast! : t)),
      };

    case 'DISMISS_TOAST':
      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== action.toastId),
      };

    case 'REMOVE_TOAST':
      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== action.toastId),
      };

    default:
      return state;
  }
}

let toastCounter = 0;

function genId() {
  toastCounter = (toastCounter + 1) % Number.MAX_VALUE;
  return toastCounter.toString();
}

interface ToastOptions {
  title?: string;
  description?: string;
  variant?: 'default' | 'destructive';
}

export function toast(options: ToastOptions) {
  const id = genId();
  const newToast: Toast = {
    id,
    ...options,
  };

  dispatch({
    type: 'ADD_TOAST',
    toast: newToast,
  });

  return {
    id,
    dismiss: () => dispatch({ type: 'DISMISS_TOAST', toastId: id }),
  };
}

export function useToast() {
  const [state, setState] = useState<ToastState>(memoryState);

  useEffect(() => {
    listeners.push(setState);
    return () => {
      const index = listeners.indexOf(setState);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    };
  }, [state]);

  return {
    ...state,
    toast,
    dismiss: (toastId: string) => dispatch({ type: 'DISMISS_TOAST', toastId }),
  };
}