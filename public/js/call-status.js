// Call Status Page JavaScript
// Handles real-time status updates via WebSocket with fallback to HTTP polling

function setStepper(status, claimedByName) {
  const reviewing = document.querySelector(".step-reviewing");
  const received  = document.querySelector(".step-received");
  const onway     = document.querySelector(".step-onway");

  [reviewing, received, onway].forEach(step => {
    step.classList.remove("is-active", "is-complete");
  });

  // Status progression:
  // NEW -> Reviewing active
  // CLAIMED -> Reviewing complete, Received active  
  // ON_THE_WAY -> Reviewing + Received complete, On the way active
  // RESOLVED -> all complete
  if (status === "NEW") {
    reviewing.classList.add("is-active");
  } else if (status === "CLAIMED") {
    reviewing.classList.add("is-complete");
    received.classList.add("is-active");

    // optionally personalize the "Received" copy
    if (claimedByName) {
      const desc = received.querySelector(".status-step-desc");
      desc.textContent = `${claimedByName} has received your request.`;
    }
  } else if (status === "ON_THE_WAY") {
    reviewing.classList.add("is-complete");
    received.classList.add("is-complete");
    onway.classList.add("is-active");

    // optionally personalize the "On the way" copy
    if (claimedByName) {
      const desc = onway.querySelector(".status-step-desc");
      desc.textContent = `${claimedByName} is on the way to help you.`;
    }
  } else if (status === "RESOLVED") {
    reviewing.classList.add("is-complete");
    received.classList.add("is-complete");
    onway.classList.add("is-complete");
  } else {
    // fallback
    reviewing.classList.add("is-active");
  }
}

// WebSocket connection with fallback to polling
class StatusUpdater {
  constructor(requestId) {
    this.requestId = requestId;
    this.websocketConnected = false;
    this.fallbackInterval = null;
    this.ws = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    
    this.initWebSocket();
    this.startFallbackTimer();
  }

  initWebSocket() {
    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      console.log('Connecting to WebSocket:', wsUrl);
      
      this.ws = new WebSocket(wsUrl);
      
      this.ws.onopen = () => {
        console.log('[WebSocket] Connected');
        this.websocketConnected = true;
        this.reconnectAttempts = 0;
        
        // Stop fallback polling since WebSocket is connected
        if (this.fallbackInterval) {
          clearInterval(this.fallbackInterval);
          this.fallbackInterval = null;
        }
        
        // Subscribe to updates for this request
        this.ws.send(JSON.stringify({
          type: 'subscribe',
          requestId: this.requestId
        }));
      };
      
      this.ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        console.log('[WebSocket] Received:', data);
        
        if (data.type === 'request_update' && data.requestId === this.requestId) {
          setStepper(data.status, data.claimedByDisplayName || null);
        }
      };
      
      this.ws.onclose = (event) => {
        console.log('[WebSocket] Disconnected:', event.code, event.reason);
        this.websocketConnected = false;
        
        // Start fallback polling
        this.startFallbackPolling();
        
        // Attempt to reconnect
        this.scheduleReconnect();
      };
      
      this.ws.onerror = (error) => {
        console.error('[WebSocket] Error:', error);
        this.websocketConnected = false;
      };
      
    } catch (error) {
      console.error('[WebSocket] Failed to create connection:', error);
      this.startFallbackPolling();
    }
  }

  scheduleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
      console.log(`[WebSocket] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts + 1})`);
      
      setTimeout(() => {
        this.reconnectAttempts++;
        this.initWebSocket();
      }, delay);
    } else {
      console.log('[WebSocket] Max reconnection attempts reached, using polling only');
    }
  }

  startFallbackTimer() {
    // Start polling after 5 seconds if WebSocket hasn't connected
    setTimeout(() => {
      if (!this.websocketConnected) {
        console.log('[WebSocket] Connection timeout, starting fallback polling');
        this.startFallbackPolling();
      }
    }, 5000);
  }

  startFallbackPolling() {
    if (this.fallbackInterval) return; // Already polling
    
    console.log('[Fallback] Starting HTTP polling');
    this.pollStatus(); // Poll immediately
    this.fallbackInterval = setInterval(() => {
      if (!this.websocketConnected) {
        this.pollStatus();
      } else {
        // WebSocket reconnected, stop polling
        clearInterval(this.fallbackInterval);
        this.fallbackInterval = null;
      }
    }, 5000); // Poll every 5 seconds as fallback
  }

  async pollStatus() {
    try {
      const res = await fetch(`/api/status/${this.requestId}`);
      if (!res.ok) return;
      const data = await res.json();
      console.log('[Fallback] Poll result:', data);
      setStepper(data.status, data.claimedByDisplayName || null);
    } catch (err) {
      console.error("Error polling status", err);
    }
  }
}

// Get requestId from script tag data attribute
function getRequestId() {
  // Find the script tag that loaded this file
  const scripts = document.getElementsByTagName('script');
  for (let script of scripts) {
    if (script.src && script.src.includes('call-status.js')) {
      return script.getAttribute('data-request-id');
    }
  }
  return null;
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  // Get requestId from the script tag data attribute
  const requestId = getRequestId();
  
  if (!requestId) {
    console.error('Request ID not found in script data attribute');
    return;
  }
  
  console.log('Initializing StatusUpdater for request:', requestId);
  
  // Initialize status updater
  const statusUpdater = new StatusUpdater(requestId);
  
  // Get initial status
  statusUpdater.pollStatus();
});