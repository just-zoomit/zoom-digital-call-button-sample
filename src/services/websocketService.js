/**
 * WebSocket service for managing real-time connections
 * Handles request-specific subscriptions and broadcasting updates
 */
class WebSocketService {
  constructor() {
    // Map of requestId -> Set of WebSocket connections
    this.requestSubscriptions = new Map();
    // Map of WebSocket -> client info
    this.clientInfo = new Map();
  }

  /**
   * Subscribe a WebSocket connection to updates for a specific request
   */
  subscribeToRequest(ws, requestId, clientInfo = {}) {
    console.log(`[WebSocket] Client subscribing to request: ${requestId}`);
    
    // Initialize request subscription set if doesn't exist
    if (!this.requestSubscriptions.has(requestId)) {
      this.requestSubscriptions.set(requestId, new Set());
    }
    
    // Add client to request subscription
    this.requestSubscriptions.get(requestId).add(ws);
    
    // Store client info
    this.clientInfo.set(ws, {
      requestId,
      subscribedAt: new Date().toISOString(),
      ...clientInfo
    });
    
    console.log(`[WebSocket] Active subscriptions for ${requestId}: ${this.requestSubscriptions.get(requestId).size}`);
  }

  /**
   * Unsubscribe a WebSocket connection from all updates
   */
  unsubscribeClient(ws) {
    const clientData = this.clientInfo.get(ws);
    if (!clientData) return;
    
    const { requestId } = clientData;
    console.log(`[WebSocket] Client unsubscribing from request: ${requestId}`);
    
    // Remove from request subscription
    if (this.requestSubscriptions.has(requestId)) {
      this.requestSubscriptions.get(requestId).delete(ws);
      
      // Clean up empty subscription sets
      if (this.requestSubscriptions.get(requestId).size === 0) {
        this.requestSubscriptions.delete(requestId);
        console.log(`[WebSocket] Removed empty subscription for request: ${requestId}`);
      }
    }
    
    // Remove client info
    this.clientInfo.delete(ws);
  }

  /**
   * Broadcast an update to all clients subscribed to a specific request
   */
  broadcastRequestUpdate(requestId, updateData) {
    const subscribers = this.requestSubscriptions.get(requestId);
    if (!subscribers || subscribers.size === 0) {
      console.log(`[WebSocket] No subscribers for request ${requestId}, skipping broadcast`);
      return;
    }

    const message = JSON.stringify({
      type: 'request_update',
      requestId,
      timestamp: new Date().toISOString(),
      ...updateData
    });

    console.log(`[WebSocket] Broadcasting to ${subscribers.size} clients for request ${requestId}:`, updateData);
    
    // Send to all subscribers, removing any dead connections
    const deadConnections = [];
    
    for (const ws of subscribers) {
      try {
        if (ws.readyState === ws.OPEN) {
          ws.send(message);
        } else {
          deadConnections.push(ws);
        }
      } catch (error) {
        console.error(`[WebSocket] Error sending to client:`, error);
        deadConnections.push(ws);
      }
    }
    
    // Clean up dead connections
    deadConnections.forEach(ws => this.unsubscribeClient(ws));
  }

  /**
   * Get statistics about current WebSocket connections
   */
  getStats() {
    const totalConnections = this.clientInfo.size;
    const activeRequests = this.requestSubscriptions.size;
    
    return {
      totalConnections,
      activeRequests,
      requestSubscriptions: Object.fromEntries(
        Array.from(this.requestSubscriptions.entries()).map(([requestId, clients]) => [
          requestId, 
          clients.size
        ])
      )
    };
  }
}

// Export singleton instance
export const websocketService = new WebSocketService();