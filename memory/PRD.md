# RYPPL — Product Requirements & Build Log

## Original Problem Statement
On-demand snack & grocery delivery for college campuses. Students order from a curated catalog; employees manage orders through a portal, pack and deliver orders to students — all coordinated through a dual-app mobile system. (From attached Ryppl.pdf product brief + wireframes.)

## MVP User Choices
- Both Customer + Employee in ONE Expo app with role-based login
- Simulated phone OTP (any 6-digit code)
- Mock payment (no real charge)
- Stylized SVG campus map with color-coded pins (no external map key)
- Curated product images (Unsplash/Pexels)

## Architecture
- Frontend: Expo Router (file-based), Plus Jakarta Sans (expo-font), @gorhom/bottom-sheet, react-native-svg, react-native-keyboard-controller, expo-image, expo-linear-gradient. Design tokens in `/app/frontend/src/theme`.
- Backend: FastAPI + MongoDB (motor). JWT auth (pyjwt). Seeds products (32), promo codes, and 2 employee accounts on startup.
- State: AuthContext (JWT via secure storage) + CartContext (persisted).

## User Personas
1. Student (Customer) — browses catalog, orders snacks/groceries to their dorm, tracks delivery, earns RYPPL points, refers friends.
2. Packer (Employee) — claims incoming orders, packs items via checklist, marks ready.
3. Runner (Employee) — claims packed orders, navigates via map, sends SMS confirmation, marks delivered.

## Core Requirements (static)
- Phone OTP auth with role detection (customer vs employee packer/runner).
- Curated catalog with 10 categories, search, product detail.
- Cart, promo codes, tip, delivery address, mock payment, order placement.
- Order state machine (8 states) with optimistic-lock claiming.
- Live campus map with color-coded pins (green=unpacked, red=packed, blue=own).
- Real-time-ish order tracking (5s polling) + timeline.
- RYPPL Points + referral code sharing.

## Implemented (2026-06 — MVP)
- Auth: send-otp / verify-otp / me; JWT; auto-create customer; seeded packer/runner.
- Customer: Home (categories + grid + hero + floating cart), Explore (search + trending + recent), Product Detail (sizes/qty/add), Cart & Checkout (qty/promo/tip/address/payment/summary), Orders list, Order Tracking (map + timeline + points), Profile (points, referral share, menu, logout).
- Employee: Queue (packer/runner segmented, claim), Live Campus Map (SVG + bottom-sheet pin popups + role-based claim CTA), Delivery/Action screen (advance state machine, pack checklist, Open in Google Maps, Send SMS confirmation, press-&-hold complete), Employee Profile.
- Backend endpoints: products/categories/trending, promo validate, orders CRUD, employee queue/map/claim/advance/sms-confirm.
- Verified: 28/28 backend tests, full frontend e2e (customer order → packer pack → runner deliver).

## Backlog / Remaining
- P1: RYPPL Points redemption flow at checkout; Stripe real payments; real Twilio SMS + phone OTP.
- P1: Admin web dashboard (catalog/promos/employees/analytics) — out of Expo scope, Next.js per brief.
- P2: Real map (react-native-maps) with live routing; push notifications (needs native build + Firebase); out-of-stock mid-pack flagging + admin alert; stale-order (15 min) alerts.
- P2: WebSocket realtime instead of polling; referral discount auto-apply on first order.

## Next Tasks
- Gather which P1 the user wants first (payments vs redemption vs admin).
- Address minor cosmetic: RN-Web shadow*/pointerEvents deprecation warnings; live status in delivery header subtitle.
