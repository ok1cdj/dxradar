/**
 * Shared WebSocket singleton.
 *
 * The whole app uses ONE persistent socket to the server instead of each
 * component opening its own. It reconnects automatically (with the same backoff
 * the app used before: 3s on a normal close, 5s on an abnormal 1006 close) so
 * every consumer benefits from reconnect rather than silently going stale.
 *
 * Usage:
 *   const off = subscribe('spot', (data) => { ... });   // off() to unsubscribe
 *   const offOpen = onOpen(() => { ... });               // fires on (re)connect
 *   const offClose = onClose(() => { ... });              // fires on disconnect
 */

type Handler = (data: any) => void;
type Listener = () => void;

const messageListeners: Record<string, Set<Handler>> = {};
const openListeners = new Set<Listener>();
const closeListeners = new Set<Listener>();

let socket: WebSocket | null = null;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
let connected = false;

function wsUrl(): string {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${protocol}//${window.location.host}`;
}

function scheduleReconnect(delay: number) {
  if (reconnectTimer) return;
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    connect();
  }, delay);
}

function connect() {
  if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) {
    return;
  }

  console.log(`Connecting to WebSocket: ${wsUrl()}`);
  const s = new WebSocket(wsUrl());
  socket = s;

  s.onopen = () => {
    connected = true;
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
    openListeners.forEach(l => {
      try { l(); } catch (e) { console.error('WS open listener failed', e); }
    });
  };

  s.onmessage = (event) => {
    let message: any;
    try {
      message = JSON.parse(event.data);
    } catch {
      return;
    }
    const set = message && message.type ? messageListeners[message.type] : undefined;
    if (set) {
      set.forEach(h => {
        try { h(message.data); } catch (e) { console.error('WS message handler failed', e); }
      });
    }
  };

  s.onclose = (event) => {
    connected = false;
    closeListeners.forEach(l => {
      try { l(); } catch (e) { console.error('WS close listener failed', e); }
    });
    // Don't reconnect too aggressively on an abnormal (1006) closure.
    scheduleReconnect(event.code === 1006 ? 5000 : 3000);
  };

  s.onerror = () => {
    // onclose fires right after and handles the reconnect.
  };
}

function ensureConnected() {
  if (!socket) connect();
}

export function isConnected(): boolean {
  return connected;
}

/** Subscribe to a message type. Returns an unsubscribe function. */
export function subscribe(type: string, handler: Handler): () => void {
  ensureConnected();
  if (!messageListeners[type]) messageListeners[type] = new Set();
  messageListeners[type].add(handler);
  return () => {
    messageListeners[type]?.delete(handler);
  };
}

/**
 * Register a callback for socket (re)connections. If the socket is already open
 * the callback fires immediately so late subscribers can sync their state.
 * Returns an unsubscribe function.
 */
export function onOpen(listener: Listener): () => void {
  ensureConnected();
  openListeners.add(listener);
  if (connected) {
    try { listener(); } catch (e) { console.error('WS open listener failed', e); }
  }
  return () => openListeners.delete(listener);
}

/** Register a callback for socket disconnections. Returns an unsubscribe function. */
export function onClose(listener: Listener): () => void {
  closeListeners.add(listener);
  return () => closeListeners.delete(listener);
}
