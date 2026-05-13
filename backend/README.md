Backend API for RentAll.

Run locally:
  cd backend
  npm install
  npm start

Endpoints:
  GET  /api/listings         - list items
  GET  /api/listings/:id     - get item
  POST /api/listings         - create listing (requires Bearer token)
  PATCH /api/listings/:id    - update own listing
  DELETE /api/listings/:id   - remove own listing
  POST /api/rentals/request  - request an active listing
  GET  /api/messages/...     - authenticated messaging
  POST /api/reviews          - review a confirmed rental
  GET  /api/subscriptions/plans - available subscription plans
  GET  /api/subscriptions/me    - current user's subscription
  POST /api/subscriptions/signup - create or update subscription
  POST /api/subscriptions/cancel - cancel active subscription

Postgres is required. Configure DATABASE_URL in backend/.env, and set JWT_SECRET for deployed environments.
