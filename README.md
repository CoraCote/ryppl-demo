# RYPPL

On-demand snack & grocery delivery for college campuses. Students order from a curated catalog; employees manage orders through a portal, pack and deliver orders to students — all coordinated through a dual-app mobile system.

## Overview

RYPPL is built as two experiences sharing one backend:

- **Customer App** — phone/OTP sign-in, browse a curated catalog by category, product search, cart & checkout, saved payment methods, promo codes, tipping, live order tracking, push notifications, and a referral/points system.
- **Employee Dashboard** — packer and runner order queues, order status state machine, live campus map, active delivery view, SMS delivery confirmation, employee role/shift detection, and conflict prevention when multiple employees try to claim the same order.
- **Admin Dashboard** (planned) — referral settings, promo/coupon management, product catalog & inventory management, employee accounts, order analytics, revenue & payouts, live order monitor.

## Tech Stack

**Frontend** — React Native via Expo, `expo-router` for file-based navigation, TypeScript.

**Backend** — FastAPI (Python), MongoDB via Motor (async driver), JWT auth, phone OTP verification.

## Repository Structure

```
ryppl-demo/
├── backend/            FastAPI service (server.py) + requirements.txt
│   └── tests/
├── frontend/           Expo / React Native app
│   ├── app/
│   │   ├── (customer)/     Home, Explore, Orders, Profile
│   │   ├── (employee)/     Order queue, Map, Profile
│   │   ├── auth/            OTP sign-in + verification
│   │   ├── product/[id]     Product detail
│   │   ├── order/[id]       Order detail / tracking
│   │   ├── delivery/[id]    Active delivery view
│   │   └── cart.tsx
│   └── src/            api client, components, context, hooks, theme, utils
├── design_guidelines.json
├── test_result.md       Testing protocol + status log (main/testing agent handoff)
└── test_reports/
```

## Current API Surface (backend/server.py)

| Method | Route | Purpose |
|---|---|---|
| POST | `/api/auth/send-otp` | Send phone verification code |
| POST | `/api/auth/verify-otp` | Verify OTP & issue session |
| GET/PATCH | `/api/auth/me` | Get / update current user profile |
| GET | `/api/products` | List catalog products |
| GET | `/api/products/trending` | Trending products |
| GET | `/api/products/{product_id}` | Product detail |
| GET | `/api/categories` | Catalog categories |
| POST | `/api/promo/validate` | Validate a promo code |
| POST/GET | `/api/orders` | Create / list orders |
| GET | `/api/orders/{order_id}` | Order detail |
| GET | `/api/employee/queue` | Packer/runner order queue |
| GET | `/api/employee/map` | Live map of active orders |
| POST | `/api/orders/{order_id}/claim` | Claim an order (packer/runner) |
| POST | `/api/orders/{order_id}/advance` | Advance order status |
| POST | `/api/orders/{order_id}/sms-confirm` | Send SMS delivery confirmation |

## Getting Started

### Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn server:app --reload
```

Requires a running MongoDB instance and the relevant environment variables (Mongo URI, JWT secret, OTP/SMS provider keys) configured before starting the server.

### Frontend

```bash
cd frontend
yarn install
yarn start
```

Then run on iOS, Android, or web from the Expo CLI menu (`yarn ios`, `yarn android`, `yarn web`).

## Screen Inventory (15 wireframed)

**Customer App** — Sign In, Verify OTP, Home, Explore, Product Detail, Profile, Cart/Checkout.

**Employee Dashboard** — Packer Orders, Runner Orders, Map (overview), Green Pin (packer), Red Pin (runner), Blue Pin (yours), SMS Confirmation.

## Roadmap

1. **Foundation** — project scaffold, Supabase project + schema, hardcoded seed data, CI + build automation, base navigation.
2. **Customer MVP** — product catalog, category filtering, cart, order submission, notification preferences.
3. **Employee MVP** — packer/runner queues, employee OTP auth, claim/state machine, campus map, SMS send, cost-of-order preview.
4. **Admin MVP** — catalog & inventory management, employee accounts, live order monitor.
5. **Real-time Layer** — push notifications (packer/runner + customer), state-machine ordering, optimistic UI updates.
6. **Polish & Launch** — referral & loyalty system, in-app support/chat, app store submission, QA hardening.

## Third-Party Integrations

Twilio (OTP + delivery SMS), Stripe (payments), Google Maps (live tracking & routing), Supabase (auth/DB option), Expo Push, CloudFlare (CDN).

## Key Risks & Open Questions

- Order conflict / simultaneous claims — two employees claiming the same order at once.
- Real-time delivery pricing during peak/surge windows.
- Employee onboarding — identity verification and account provisioning flow.
- Inventory sync between the campus store and the RYPPL catalog.
- Delivery radius / campus zone boundaries and how they're enforced.
- RYPPL Points redemption mechanics and expiration rules.

## Testing

See [test_result.md](test_result.md) for the current testing protocol and status log shared between the main and testing agents.
