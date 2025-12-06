# 🛒 Zoom Digital Call Button Demo

A real-time digital call button system using Zoom Team Chatbot, Node.js, Express, and WebSocket technology. Customers can request help in-store and see instant status updates as associates respond through Zoom Team Chat.

## ✨ Features

- **🔄 Real-time updates**: WebSocket-powered instant status updates (< 100ms)
- **📱 Mobile-friendly**: Responsive design for in-store customer use
- **🔒 Security**: CSP-compliant with Helmet security middleware
- **⚡ Progressive enhancement**: Automatic fallback to HTTP polling if WebSocket fails
- **🎯 Interactive buttons**: Associates can "Claim" and mark "On the way" via Zoom chat
- **📊 Status tracking**: Visual stepper UI showing request progression
- **🛡️ Rate limiting**: Built-in protection against abuse

## 🚀 Quick Start

### Prerequisites

- Node.js 16+ 
- Zoom Team Chat app with chatbot permissions
- Ngrok (for local development with HTTPS tunnel)

### Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd zoom-chatbot-digital-call-button-sample

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env and fill in your Zoom app credentials
```

### Environment Configuration

Create a `.env` file with these required variables:

```bash
# Zoom App Credentials
ZOOM_CLIENT_ID=your_zoom_client_id
ZOOM_CLIENT_SECRET=your_zoom_client_secret
ZOOM_CHANNEL_ID=your_zoom_channel_id

# Server Configuration (optional)
PORT=3000
```

### Local Development Setup

1. **Start Ngrok tunnel** (required for Zoom webhooks):
   ```bash
   ngrok http 3000
   ```
   
   Copy the HTTPS URL (e.g., `https://abc123.ngrok.io`)

2. **Configure Zoom App webhook**:
   - Go to Zoom Marketplace → Your App → Features → Event Subscriptions
   - Add Event Subscription URL: `https://abc123.ngrok.io/zoom/webhook`
   - Subscribe to `interactive_message_actions` events

3. **Start the development server**:
   ```bash
   npm run dev
   ```

4. **Test the application**:
   Visit: `https://abc123.ngrok.io/call?storeId=store-123&itemId=item-apples`

## 🏗️ Architecture

### Real-time Communication Flow

```
Customer Request → WebSocket Connection → Database → Zoom Webhook → Associate Action → WebSocket Broadcast → Instant UI Update
```

### Status Progression

1. **NEW** → Customer submits request (Reviewing step active)
2. **CLAIMED** → Associate clicks "Claim" (Received step active)  
3. **ON_THE_WAY** → Associate clicks "On the way" (On the way step active)
4. **RESOLVED** → Request completed (All steps complete)

## 🧪 Testing

### Manual Testing Endpoints

The application includes built-in testing endpoints for debugging:

```bash
# Test claim functionality
GET /zoom/test-claim/:requestId

# Test on-the-way functionality  
GET /zoom/test-ontheway/:requestId

# Check WebSocket connection stats
GET /ws-stats

# Health check
GET /health
```

### End-to-End Testing Flow

1. **Create a help request**:
   ```bash
   curl -X POST http://localhost:3000/call-request \
     -H "Content-Type: application/x-www-form-urlencoded" \
     -d "storeId=store-123&itemId=item-apples&promptId=prompt-find-more"
   ```

2. **Check request status**:
   ```bash
   curl http://localhost:3000/api/status/req_your_request_id
   ```

3. **Simulate claim action**:
   ```bash
   curl http://localhost:3000/zoom/test-claim/req_your_request_id
   ```

4. **Verify real-time update**:
   - Watch the browser status page update instantly
   - Check WebSocket logs in browser console

### WebSocket Testing

Open browser console on status page to see real-time logs:

```javascript
// Expected logs when WebSocket works:
[WebSocket] Connected
[WebSocket] Received: {"type":"request_update",...}

// Expected logs when falling back to polling:
[WebSocket] Connection timeout, starting fallback polling
[Fallback] Starting HTTP polling
```

## 📂 Project Structure

```
├── src/
│   ├── config/           # Environment configuration
│   ├── db/              # Mock database (in-memory)
│   ├── middleware/      # Express middleware (auth, rate limiting, WebSocket)
│   ├── routes/          # API and page routes
│   ├── services/        # Business logic (chatbot, requests, WebSocket)
│   ├── utils/           # Utilities (ID generation, Zoom auth)
│   └── server.js        # Main server with WebSocket support
├── public/
│   ├── js/              # Client-side JavaScript (CSP-compliant)
│   └── styles.css       # Styling
├── views/               # EJS templates
└── package.json
```

### Key Components

- **WebSocket Service** (`src/services/websocketService.js`): Manages real-time connections
- **Chatbot Service** (`src/services/chatbotService.js`): Zoom Team Chat integration  
- **Request Service** (`src/services/requestService.js`): Business logic with WebSocket broadcasting
- **Zoom Auth** (`src/utils/zoom-chatbot-auth.js`): OAuth token management
- **Client Script** (`public/js/call-status.js`): Real-time status updates with fallback

## 🔧 Configuration

### Zoom App Requirements

Your Zoom app needs these configurations:

**Scopes:**
- `chat_message:write` - Send messages to Team Chat
- `chat_message:read` - Receive webhook events

**Event Subscriptions:**
- `interactive_message_actions` - Handle button clicks

**Webhook URL:**
- `https://your-domain.com/zoom/webhook`

### Security Features

- **Helmet**: Content Security Policy and security headers
- **Rate Limiting**: Prevents API abuse
- **CORS**: Configured for same-origin requests
- **Input Validation**: Query parameter and form validation
- **Error Handling**: Graceful error responses

## 🚀 Production Deployment

### Environment Variables

```bash
# Production settings
NODE_ENV=production
PORT=3000

# Zoom credentials
ZOOM_CLIENT_ID=your_production_client_id
ZOOM_CLIENT_SECRET=your_production_client_secret
ZOOM_CHANNEL_ID=your_production_channel_id
```

### Deployment Checklist

- [ ] Set up HTTPS (required for WebSocket and Zoom webhooks)
- [ ] Configure production Zoom app with production webhook URL
- [ ] Set up process manager (PM2, systemd, etc.)
- [ ] Configure reverse proxy (Nginx, Apache)
- [ ] Set up monitoring and logging
- [ ] Test WebSocket functionality in production environment

### Performance Considerations

- **WebSocket connections**: Scales to thousands of concurrent connections
- **Memory usage**: In-memory database - consider Redis/PostgreSQL for production
- **Rate limiting**: Configured for reasonable API usage
- **Static assets**: Served efficiently via Express static middleware

## 🐛 Troubleshooting

### Common Issues

**WebSocket connection fails:**
- Check HTTPS setup (WebSocket requires secure connection in production)
- Verify firewall allows WebSocket traffic
- Check browser console for connection errors

**Zoom webhook not received:**
- Confirm webhook URL is publicly accessible
- Check webhook URL in Zoom app configuration
- Verify HTTPS certificate validity
- Monitor server logs for incoming webhooks

**CSP violations:**
- All JavaScript is external and CSP-compliant
- If issues persist, check Helmet configuration

### Debug Tools

```bash
# Check WebSocket connections
curl http://localhost:3000/ws-stats

# Monitor server logs
npm run dev  # Shows all WebSocket and webhook activity

# Test webhook manually
curl -X POST http://localhost:3000/zoom/webhook \
  -H "Content-Type: application/json" \
  -d '{"event":"interactive_message_actions","payload":{...}}'
```

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📞 Support

For questions or issues:
- Check the troubleshooting section above
- Review server logs for WebSocket and webhook activity
- Test with the built-in debugging endpoints