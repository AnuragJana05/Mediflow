import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

export interface ToastMessage {
  id: string;
  type: 'info' | 'success' | 'warning' | 'critical';
  title: string;
  message: string;
  timestamp: Date;
}

interface WebSocketContextType {
  isConnected: boolean;
  lastEvent: { type: string; data: any } | null;
  toasts: ToastMessage[];
  removeToast: (id: string) => void;
  sendPing: () => void;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

export const WebSocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [lastEvent, setLastEvent] = useState<{ type: string; data: any } | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [socket, setSocket] = useState<WebSocket | null>(null);

  const addToast = useCallback((type: 'info' | 'success' | 'warning' | 'critical', title: string, message: string) => {
    const id = `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const newToast: ToastMessage = { id, type, title, message, timestamp: new Date() };
    setToasts((prev) => [newToast, ...prev.slice(0, 4)]);
    // Auto dismiss after 6 seconds
    setTimeout(() => {
      removeToast(id);
    }, 6000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  useEffect(() => {
    let ws: WebSocket | null = null;
    let reconnectTimeout: any = null;

    const connect = () => {
      const customWsUrl = (import.meta.env.VITE_WS_URL || '').trim();
      let wsUrl: string;
      if (customWsUrl) {
        wsUrl = customWsUrl;
      } else {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        wsUrl = `${protocol}//${window.location.host}/ws`;
      }

      try {
        ws = new WebSocket(wsUrl);

        ws.onopen = () => {
          setIsConnected(true);
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            setLastEvent(data);

            // Handle event notifications
            if (data.type === 'BED_STATUS_CHANGED') {
              addToast(
                'info',
                'Bed Status Updated',
                `Bed ${data.data.bed_id} changed from ${data.data.old_status} to ${data.data.new_status}`
              );
            } else if (data.type === 'PATIENT_REGISTERED') {
              addToast(
                data.data.priority === 'Critical' ? 'critical' : 'warning',
                'Patient Intake Registered',
                `${data.data.name} assessed as Priority ${data.data.priority} (${data.data.department})`
              );
            } else if (data.type === 'RECOMMENDATION_APPROVED') {
              addToast(
                'success',
                'Bed Allocation Approved',
                `Bed ${data.data.bed_id} confirmed for ${data.data.patient_name} by ${data.data.approved_by}`
              );
            } else if (data.type === 'PATIENT_DISCHARGED') {
              addToast(
                'info',
                'Patient Discharged',
                `Bed ${data.data.bed_id || 'unassigned'} released and transitioned to Cleaning`
              );
            } else if (data.type === 'SURGE_SIMULATION_ACTIVATED') {
              addToast(
                'critical',
                'SURGE INCIDENT ACTIVATED',
                `Inflow spike: +${data.data.incoming} patients. Overall occupancy surged to ${data.data.overall_occupancy}%`
              );
            } else if (data.type === 'SURGE_SIMULATION_RESET') {
              addToast(
                'success',
                'Surge Simulation Reset',
                `Cleared ${data.data.cleared_patients} synthetic simulation records. Baseline restored.`
              );
            }
          } catch {
            // ignore non-json
          }
        };

        ws.onclose = () => {
          setIsConnected(false);
          // Try to reconnect every 4 seconds
          reconnectTimeout = setTimeout(connect, 4000);
        };

        ws.onerror = () => {
          setIsConnected(false);
          ws?.close();
        };

        setSocket(ws);
      } catch {
        reconnectTimeout = setTimeout(connect, 4000);
      }
    };

    connect();

    return () => {
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      if (ws) ws.close();
    };
  }, [addToast]);

  const sendPing = () => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type: 'PING' }));
    }
  };

  return (
    <WebSocketContext.Provider value={{ isConnected, lastEvent, toasts, removeToast, sendPing }}>
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
};
