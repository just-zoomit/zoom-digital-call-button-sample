import { websocketService } from '../services/websocketService.js';

/**
 * WebSocket connection handler
 * Manages client connections, message routing, and cleanup
 */
export function handleWebSocketConnection(ws, request) {
  console.log(`[WebSocket] New connection from ${request.socket.remoteAddress}`);
  
  // Send welcome message
  ws.send(JSON.stringify({
    type: 'connection_established',
    message: 'WebSocket connection established',
    timestamp: new Date().toISOString()
  }));

  // Handle incoming messages
  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data.toString());
      handleClientMessage(ws, message);
    } catch (error) {
      console.error('[WebSocket] Invalid message format:', error);
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Invalid message format. Expected JSON.',
        timestamp: new Date().toISOString()
      }));
    }
  });

  // Handle connection close
  ws.on('close', (code, reason) => {
    console.log(`[WebSocket] Connection closed: ${code} ${reason}`);
    websocketService.unsubscribeClient(ws);
  });

  // Handle connection errors
  ws.on('error', (error) => {
    console.error('[WebSocket] Connection error:', error);
    websocketService.unsubscribeClient(ws);
  });
}

/**
 * Handle messages from WebSocket clients
 */
function handleClientMessage(ws, message) {
  const { type, requestId } = message;
  
  console.log(`[WebSocket] Received message:`, { type, requestId });

  switch (type) {
    case 'subscribe':
      handleSubscription(ws, message);
      break;
      
    case 'unsubscribe':
      handleUnsubscription(ws, message);
      break;
      
    case 'ping':
      handlePing(ws, message);
      break;
      
    default:
      console.warn(`[WebSocket] Unknown message type: ${type}`);
      ws.send(JSON.stringify({
        type: 'error',
        message: `Unknown message type: ${type}`,
        timestamp: new Date().toISOString()
      }));
  }
}

/**
 * Handle subscription requests
 */
function handleSubscription(ws, message) {
  const { requestId, clientInfo = {} } = message;
  
  if (!requestId) {
    ws.send(JSON.stringify({
      type: 'error',
      message: 'requestId is required for subscription',
      timestamp: new Date().toISOString()
    }));
    return;
  }

  // Subscribe client to request updates
  websocketService.subscribeToRequest(ws, requestId, clientInfo);
  
  // Confirm subscription
  ws.send(JSON.stringify({
    type: 'subscription_confirmed',
    requestId,
    message: `Subscribed to updates for request ${requestId}`,
    timestamp: new Date().toISOString()
  }));
}

/**
 * Handle unsubscription requests
 */
function handleUnsubscription(ws, message) {
  websocketService.unsubscribeClient(ws);
  
  ws.send(JSON.stringify({
    type: 'unsubscription_confirmed',
    message: 'Unsubscribed from all updates',
    timestamp: new Date().toISOString()
  }));
}

/**
 * Handle ping requests (for connection health checks)
 */
function handlePing(ws, message) {
  ws.send(JSON.stringify({
    type: 'pong',
    timestamp: new Date().toISOString(),
    originalTimestamp: message.timestamp
  }));
}