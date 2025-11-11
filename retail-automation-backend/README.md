# Retail Automation Backend

This repository contains the backend for the Retail Automation platform (multi-tenant). It implements stock, sales, customers, and a marketing automation queue for Instagram and WhatsApp.

Quick start (Windows PowerShell)

1. Install dependencies

```powershell
cd .\retail-automation-backend
npm install
```

2. Create a `.env` file at the project root with at least the following variables (example):

```
DB_NAME=your_db
DB_USER=your_user
DB_PASSWORD=your_pass
DB_HOST=127.0.0.1
DB_PORT=5432
JWT_SECRET=change_this
REDIS_URL=redis://127.0.0.1:6379
# Optional for Twilio WhatsApp
TWILIO_ACCOUNT_SID=your_sid
TWILIO_AUTH_TOKEN=your_token
TWILIO_WHATSAPP_FROM=+1415XXXXXXX
# Optional for Instagram
IG_TEST_MODE=true
IG_ACCESS_TOKEN=...
IG_USER_ID=...
```

3. Create or ensure PostgreSQL database exists and Redis is running.

4. Sync DB models (quick local setup)

```powershell
npm run db:sync
```

Note: This script uses `sequelize.sync({ alter: true })` by default which updates tables to match models. For production you should use proper migrations.

5. Start server

```powershell
npm run dev
```

6. Start marketing worker (in a separate shell)

```powershell
node .\src\queue\marketingWorker.js
```

What I added
- MarketingQueue and Template models
- Basic Instagram and WhatsApp service wrappers
- Bull worker that processes marketing jobs
- Enqueueing on stock update
- Routes to list and approve pending marketing jobs

Next steps (recommended)
- Add proper Sequelize migrations for production
- Add store-level encrypted credential storage for IG/Twilio
- Implement UI and better approval workflow with actual admin users
- Add tests for enqueueing and worker processing

Postman examples (quick validation)

1) Register store
- Method: POST
- URL: http://localhost:3000/api/auth/register
- Body (JSON):
  {
    "store_name": "My Store",
    "mobile_number": "9123456789",
    "email": "owner@example.com",
    "password": "Password123"
  }

2) Login (get access token)
- Method: POST
- URL: http://localhost:3000/api/auth/login
- Body (JSON):
  {
    "email": "owner@example.com",
    "password": "Password123"
  }
- Response contains `accessToken` — add header to subsequent requests:
  Authorization: Bearer <accessToken>

3) Create a customer (opt-in for WhatsApp)
- Method: POST
- URL: http://localhost:3000/api/customers
- Headers: Authorization
- Body (JSON):
  {
    "name": "A Customer",
    "mobile_number": "9123456789",
    "whatsapp_opt_in": true
  }

4) Create a product
- Method: POST
- URL: http://localhost:3000/api/products
- Headers: Authorization
- Body (JSON):
  {
    "name": "Blue Shirt",
    "cost_price": 300,
    "selling_price": 499,
    "stock_quantity": 10,
    "image_urls": ["https://example.com/image1.jpg"]
  }

5) Update stock (this enqueues WhatsApp + Instagram job)
- Method: PATCH
- URL: http://localhost:3000/api/products/:id/stock
- Headers: Authorization
- Body (JSON):
  {
    "quantity": 5,
    "operation": "add"
  }
- Response includes `marketing_enqueued: true` indicating a marketing job was created.

6) List pending marketing jobs (admin/store)
- Method: GET
- URL: http://localhost:3000/api/marketing/pending
- Headers: Authorization
- Response: array of queue items; note `send_instagram` and `send_whatsapp` flags.

7) Approve Instagram post (admin action)
- Method: POST
- URL: http://localhost:3000/api/marketing/:id/approve
- Headers: Authorization
- On approval, the worker will requeue the item and publish to Instagram (if credentials configured).

Notes:
- Make sure the marketing worker is running (see README steps). WhatsApp messages will be sent by the worker to customers with `whatsapp_opt_in=true`. Instagram posts will only publish after the queue item is approved by a store admin.
- If Twilio or Instagram credentials are not configured, messages/posts fall back to logging (safe for local testing).

