




### Start your Ngrok (reverse proxy)

To develop locally, you need to tunnel traffic to this application via https, because the application serves traffic from `http://localhost`. You can use Ngrok to do this. Once installed you may run this command from your terminal:

```bash
ngrok http 3000
```

Ngrok will output the origin it has created for your tunnel, eg `https://9a20-38-99-100-7.ngrok.io`. You'll need to use this across your Zoom App configuration in the Zoom Marketplace (web) build flow (see below).

Please copy the https origin from the Ngrok terminal output and paste it in the `PUBLIC_URL` value in the `.env` file.
![ngrok https origin](screenshots/ngrok-https-origin.png)

Please note that this ngrok URL will change once you restart ngrok (unless you purchased your own ngrok pro account). If you shut down your Ngrok (there's no harm to leaving it on), upon restart you'll need to copy and paste the new origin into the `.env` file AND also to your Marketplace build flow.

### Where to configure this in Zoom (Chatbot)

Inside your Zoom Chatbot app configuration:

Feature → Event Subscriptions → Add Event Subscription → Endpoint URL
➡ Paste:

```
<your-base-url>/zoom/webhook
https://757d914a70ee.ngrok.app/zoom/webhook

```

### How to run

```bash
npm install
cp .env.example .env
# fill ZOOM_CLIENT_ID and ZOOM_CLIENT_SECRET
npm run dev

```

### Then hit:

```
http://localhost:3000/call?storeId=store-123&itemId=item-apples

```
You’ll see the call button flow, and the backend will “send” (log + attempt) a message to the Zoom chat API.

------

## 1. Manual Tests (No Test Framework Needed)

### a) Test different query param combos

Use something like Postman / curl to hit:

* ✅ Valid:

  * `GET /call?storeId=store-123&itemId=item-apples`
* ❌ Invalid:

  * Missing params: `/call`
  * Bad store: `/call?storeId=store-999&itemId=item-apples`
  * Bad item: `/call?storeId=store-123&itemId=does-not-exist`

You’re testing:

* 400 vs 404 behavior
* Error pages vs success pages.

---

### Test the full happy path *without* browser UI

1. **Create help request via POST**
   Instead of submitting the HTML form, simulate it:

   ```bash
   curl -X POST http://localhost:3000/call-request \
     -H "Content-Type: application/x-www-form-urlencoded" \
     -d "storeId=store-123&itemId=item-apples&promptId=prompt-find-more"
   ```

   Check:

   * Server logs
   * That it renders the status page HTML

2. **Check status API directly**

   After creating a request, grab the `requestId` from logs (or temporarily log it in `call-request`) and hit:

   ```bash
   curl http://localhost:3000/api/status/req_xxx
   ```

   You should see:

   ```json
   { "id": "req_xxx", "status": "NEW", "claimedByDisplayName": null }
   ```

3. **Simulate a claim via Zoom webhook**

   POST to your stub:

   ```bash
   curl -X POST http://localhost:3000/zoom/webhook \
     -H "Content-Type: application/json" \
     -d '{
       "event": "card_action",
       "payload": {
         "action": "claim_request",
         "requestId": "req_xxx",
         "user": { "id": "zoomUserId123", "name": "Test User" }
       }
     }'
   ```

   Then hit:

   ```bash
   curl http://localhost:3000/api/status/req_xxx
   ```

   and confirm:

   ```json
   {
     "id": "req_xxx",
     "status": "CLAIMED",
     "claimedByDisplayName": "Test User"
   }
   ```

That gives you end-to-end coverage: request → saved → claimed → status update.

