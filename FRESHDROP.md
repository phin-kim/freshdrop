# Freshdrop Site and Business Logic

This document describes the Freshdrop website and the business logic implemented in this repository. It is based on the code as it currently exists; it does not confirm the production environment, provider settings, or operational policies outside the codebase.

## 1. Product overview

Freshdrop is a grocery ordering and delivery service. Customers browse products from local markets and supermarkets, select a delivery location, pay by wallet or M-Pesa, and follow order progress. Riders fulfil deliveries, with order dispatch and several delivery actions handled through Telegram. Staff use an admin interface to maintain inventory, manage orders and riders, review analytics, and respond to support tickets.

### Technology and integrations

- **Frontend:** React, TypeScript, Vite, React Router, TanStack Query, Zustand, and Tailwind CSS.
- **Backend:** Node.js, Express, TypeScript, and Socket.IO.
- **Database:** PostgreSQL accessed through Prisma.
- **Authentication:** Better Auth with email/password, password reset, two-factor authentication, and roles.
- **Maps and routes:** Mapbox geocoding and driving directions.
- **Payments:** PayHero M-Pesa STK push and transaction status checks.
- **Other services:** Telegram courier bot, Cloudinary image uploads, and Brevo email.

The frontend application and routes are assembled in `frontend/src/App.tsx`. The backend middleware and API mounts are in `backend/src/Server.ts`. Shared pricing constants and location checks are in `shared/constants.ts` and `shared/geofence.ts`.

## 2. Accounts, roles, and routes

Better Auth is configured for email/password authentication, password reset, two-factor authentication, and `user`, `rider`, and `admin` roles. Session-protected backend routes use the authentication middleware to retrieve and attach the session user.

Public frontend pages include the landing page, sign-up, sign-in, password reset, legal pages, two-factor setup and verification, and rider activation. Authenticated pages include home, discovery, cart, order history, rider dashboard, admin, profile, wallet, and support.

The frontend's protected-route component checks whether the visitor is signed in. The navigation only shows the admin and rider links for users with the corresponding role.

## 3. Customer experience

### Discover products

The customer can browse the product catalogue, select a store, search, filter by category, and sort products. The displayed catalogue includes product information such as name, category, image, unit text, seasonal/organic flags, price, and availability.

Product details are split between:

- `Product`: general product information, such as name, category, base price, and image.
- `StoreProductConfig`: a product's store-specific price and stock status.
- `Store`: a store identity, sourcing type, coordinates, and hub association.
- `Hub`: an operational location grouping stores and delivery routing.

Products are loaded from the backend with their store configurations. Discovery uses saved address text to infer a hub when it contains “juja” or “machakos”; if neither is recognized, the page can offer all configured store options. See `frontend/src/Pages/Discovery.tsx` and `backend/src/Controllers/UserControllers/userProducts.ts`.

### Basket

Customers add products to a basket, increase or decrease quantities, remove items, and clear the basket. Basket contents are persisted in browser `localStorage` under `fh_cart`. The selected delivery state, including address and estimate data, is persisted in `sessionStorage`.

The basket subtotal is the sum of each selected product's displayed local price multiplied by its quantity. The cart requests a server-side checkout preview to populate the delivery fee and wallet-coverage information.

### Delivery address and map

The location selector supports:

1. Searching Mapbox address suggestions.
2. Using the browser's current-location permission and device coordinates.
3. Selecting and adjusting a pin on a map.
4. Entering the delivery destination and specific apartment/building, house/room, and optional landmark details.

Mapbox search and reverse-geocoding resolve coordinates and address labels. The frontend checks the point against the shared service-area polygon before submitting. The backend repeats a serviceability check, creates a saved address, requests driving distances from active hubs, and stores a fee estimate per address/hub pair in `HubDeliveryFee`.

The saved address may be labelled (for example Home or Work) and marked as the customer's default. Address records include coordinates and delivery details. See `frontend/src/Components/Pages/Maps.tsx`, `frontend/src/Components/Pages/SavedAddresses.tsx`, `backend/src/Controllers/UserControllers/deliveryEstimate.ts`, and `shared/geofence.ts`.

### Checkout options

At checkout, the customer chooses what to do when an item is unavailable:

- **REFUND:** refund the unavailable item's purchase value to the customer's Freshdrop wallet. If no items remain available, the order is cancelled and the full amount is refunded.
- **REPLACE:** record the replacement preference. Replacement handling is not implemented in the rider's missing-item controller in the same way as the refund path; see the caveats section.

Customers can pay using wallet funds if their balance covers the calculated total. Otherwise, the checkout flow requests an M-Pesa STK push to the supplied Kenyan phone number.

### Order history and notifications

The customer can view paginated historical orders and the latest active order. Active statuses are `PENDING`, `PAID`, `ASSIGNED`, and `PICKED_UP`. While an active order exists, the history page refreshes order status approximately every four seconds.

Persisted notifications include order placed, rider assigned, pickup/delivery, cancellation, and refund events. The backend stores them and emits a Socket.IO `notification_received` event to the user's socket room. The frontend loads notifications after authentication and displays a notification drawer.

### Profile, wallet, and support

The profile page allows the customer to update their name/email, upload a profile image, manage saved addresses, and sign out. Image uploads are sent to Cloudinary; the resulting URL is saved on the user and, if applicable, their rider profile.

The wallet page displays the current balance, recent transactions, transaction history, and top-up controls. Customers can top up via an M-Pesa STK push. The support page lets signed-in customers submit and view their tickets.

## 4. Pricing and financial calculations

The active backend pricing functions are in `backend/src/Utils/costCalculation.ts`. Their constants are in `shared/constants.ts`. Amounts are in Kenyan shillings (KES).

### Distance-based delivery fee

The implementation starts with a base fee of **KES 100**:

- At or below 1 km: KES 100.
- Above 1 km through 3 km: add KES 20 for each kilometre above 1 km.
- Above 3 km: add KES 40 for each kilometre above 3 km, after the first two KES 20 increments.
- The resulting distance fee is rounded to a whole number.

Examples:

| Route distance | Distance-based fee |
| ---: | ---: |
| 1 km or less | KES 100 |
| 2 km | KES 120 |
| 3 km | KES 140 |
| 4 km | KES 180 |
| 5 km | KES 220 |
| 6 km | KES 260 |

There is no upper-distance cap in the current formula.

### Multi-store surcharge

The surcharge depends on the number of distinct stores represented by the basket:

| Distinct stores | Surcharge |
| ---: | ---: |
| 1 | KES 0 |
| 2 | KES 40 |
| 3 or more | KES 60 |

### Customer total

The active customer total is:

> **Total due = item subtotal + KES 35 service fee + distance-based delivery fee + multi-store surcharge**

The item subtotal is the sum of each item's selected price multiplied by its quantity. The checkout preview obtains configured store prices and route distances; it chooses the furthest store route for the distance-based fee.

Example: a KES 1,000 subtotal, a 4 km furthest-store route, and two distinct stores gives:

- Item subtotal: KES 1,000
- Service fee: KES 35
- Distance fee: KES 180
- Multi-store surcharge: KES 40
- **Total due: KES 1,255**

### Rider and platform allocation

The base KES 100 distance fee goes to the rider. The additional distance fee is split 83% to the rider and 17% to platform commission. Multi-store surcharge is split 70% to the rider and 30% to the platform. Platform total adds the KES 35 service fee to platform commission.

For the example above:

- Additional distance amount: KES 80.
- Rider's base and distance share: KES 100 + (KES 80 × 83%) = KES 166.40.
- Platform distance commission: KES 80 × 17% = KES 13.60.
- Rider's multi-store share: KES 40 × 70% = KES 28.
- Platform's multi-store share: KES 40 × 30% = KES 12.
- **Rider payout: KES 194.40.**
- **Platform total: KES 60.60**, comprising KES 25.60 total commission and KES 35 service fee.

The calculation snapshot is stored in `OrderFinancial`, including the distance, subtotal, delivery fee, surcharge, rider payout, platform commission, platform total, and commission rate at checkout.

### Older fee helper

There is also a frontend helper that calculates a compounding per-unit service charge starting at KES 10 and increasing by 50% for each additional unit. A similar older calculation appears in a commented section of the backend utility. This is **not** the active cart/checkout pricing rule: the current cart and backend financial calculation use the fixed KES 35 service fee.

## 5. Payment and order lifecycle

### M-Pesa order payment

1. The authenticated customer submits basket items, address details, route distance, phone number, and an idempotency key.
2. The backend identifies the participating stores and active hubs and calculates a financial snapshot.
3. If the wallet balance is sufficient, it creates a paid order, debits the wallet, records a successful `PURCHASE` transaction, and initiates dispatch.
4. Otherwise, it requests a PayHero M-Pesa STK push, creates a `PENDING` order, and stores a payment transaction with the provider reference and checkout request ID.
5. The checkout UI polls the payment status every two seconds for up to 30 attempts.
6. On successful confirmation, the order becomes `PAID`, a customer notification is created, and the order is dispatched.
7. On failed confirmation, the order becomes `CANCELLED` and the customer is notified.

The payment reference is protected by an idempotency key so a repeated request can return an existing payment attempt rather than starting another one. Payment and order data are in the `PaymentTransaction`, `Order`, and `OrderFinancial` models.

### Wallet top-ups

The wallet top-up request validates amount and Kenyan phone number, initiates an M-Pesa STK push, and creates a pending `TOPUP` transaction. A successful callback or subsequent provider status check finalizes the transaction and increments the wallet balance. Top-up status is tied to the authenticated wallet owner.

### Wallet transactions and refunds

Wallet ledger transaction types are:

- `TOPUP`: incoming M-Pesa wallet funding.
- `PURCHASE`: wallet funds used for an order.
- `REFUND`: an order/item refund credited to the wallet.
- `WITHDRAWAL`: represented in the model/UI but not currently wired to a backend payout flow.

For missing items with the `REFUND` preference, the rider endpoint marks the item unavailable and updates store availability. A partial refund is the unavailable item's purchase price multiplied by quantity; the item and overall order amounts are reduced while delivery/service fees remain. When all order items are unavailable, the order is cancelled and the full recorded total is credited to the wallet.

## 6. Rider operations and dispatch

### Rider account and dashboard

An admin can create rider records, which are initially pending activation. An emailed activation link lets the rider create an account or associate an existing user account with the `rider` role. Riders can update their self-service status among `AVAILABLE`, `ON_BREAK`, and `OFFLINE`.

The rider dashboard displays rider profile data, active assigned deliveries, the available paid/unassigned order pool, completed deliveries, earnings, drop counts, and a completion-rate calculation. The rider can navigate to the customer location, call or message the customer, and mark an item unavailable.

### Telegram dispatch

Telegram is the primary courier dispatch and delivery-action workflow:

1. When an order becomes `PAID`, the backend posts an offer in the configured courier group, including hub, delivery area, and payout.
2. A rider links their Telegram account by sharing the phone contact matching their registered rider profile.
3. A registered, non-offline rider can claim a posted order. The database update is conditional on the order still being `PAID`, preventing two riders from successfully claiming the same order.
4. Telegram sends the rider the pickup hub, delivery details, items, coordinates, and payout. A customer notification records rider assignment.
5. The rider marks the order as picked up, changing its status to `PICKED_UP`.
6. At delivery, the rider submits the four-digit PIN associated with the order. A matching PIN changes status to `DELIVERY_COMPLETED` and makes the rider available again.
7. An emergency cancellation releases an assigned/picked-up order back to `PAID` for another rider. If pickup had occurred, the configured Telegram admin chat is alerted.
8. A scheduled job checks for paid, unassigned orders older than ten minutes and reposts them to the courier group.

Order statuses are `PENDING`, `PAID`, `ASSIGNED`, `PICKED_UP`, `DELIVERY_COMPLETED`, and `CANCELLED`.

## 7. Admin functionality

The admin dashboard presents sections for inventory, merchants, orders, riders, analytics, and tickets. Current section functionality includes:

### Inventory

- Paginated product listing and category filter.
- Product creation and editing.
- Store-specific price and stock status synchronization.
- Quick stock-status toggle.
- Soft deletion, which hides products without removing historical order references.

### Orders and dispatch

- Paginated order list with customer, order items, payment status, rider, and financial details.
- Summary metrics for total orders, active/in-transit orders, completed orders, and gross order value.
- Manual rider assignment and Telegram notification to the assigned rider.

### Riders

- Create, update, and soft-delete rider profiles.
- Set vehicle, dispatch hub, status, and rating.
- Review active riders and delivery-count metrics.
- Resend an activation invitation.

### Analytics

- Date ranges: today, 7 days, 30 days, 90 days, 6 months, 1 year, all time, and custom.
- Order status funnel.
- Revenue, service-fee, platform-commission, platform-total, and rider-payout totals.
- Category sales and units.
- Charts for trends, sourcing type, and customer segments.

### Support tickets

- View paginated tickets and counts by request/comment/complaint and pending review.
- Update ticket status and administrative response.
- Soft-delete tickets.

## 8. Data model overview

The Prisma schema in `backend/prisma/schema.prisma` defines the principal business records:

- **Hub, Store:** distribution geography and participating retailers/markets.
- **Product, StoreProductConfig, PriceLog:** catalogue data, per-store price/availability, and price-change audit history.
- **SavedAddress, HubDeliveryFee:** customer delivery details and cached per-hub route estimates.
- **Order, OrderItem, OrderFinancial:** order lifecycle, purchase-time item price/availability, and financial snapshot.
- **PaymentTransaction:** external M-Pesa order-payment state and references.
- **Wallet, WalletTransaction:** customer balance and ledger.
- **Rider:** rider account, Telegram identity, availability, vehicle, and assignments.
- **Notification:** persisted per-customer event notifications.
- **SupportTicket:** customer requests, complaints, and comments.
- **User, Account, Session, TwoFactor, Verification:** authentication and user records.

## 9. API surface summary

The backend mounts route groups under `/api`:

- `/api/user`: delivery estimates, product listing, profile image, saved addresses, orders, and wallet.
- `/api/payments`: order initiation, payment webhook, payment status, and checkout preview.
- `/api/admin`: product, rider, order, analytics, and ticket management.
- `/api/rider`: rider dashboard, rider status, activation, and unavailable-item actions.
- `/api/ticket`: customer ticket submission and retrieval.
- `/api/notifications`: notification retrieval and read-state updates.
- `/api/courier`: currently exposes an SMS test route.
- `/api/auth`: Better Auth handlers.

## 10. Implementation caveats and differences to be aware of

These observations describe the code and do not establish whether an upstream gateway, reverse proxy, or deployment layer adds additional controls.

1. **Admin authorization:** the frontend navigation hides the admin link from non-admin roles, but the `/api/admin` route group does not apply the session authentication middleware or role-check middleware in the route definitions. A frontend-only visibility rule is not backend authorization.
2. **Admin order-stage route:** the admin UI contains a call to update order status, but the corresponding backend route is commented out. Current rider pickup and delivery transitions are driven by Telegram actions.
3. **Merchants tab:** the admin page displays a merchants tab, but the corresponding merchants content is commented out. The store counts displayed in the header are hard-coded.
4. **Preview and payment initiation use different inputs:** checkout preview calculates configured store prices and fetches store-to-customer routes, selecting the furthest route. Order initiation recalculates from the submitted distance and submitted product local prices. These flows can diverge if the client payload is stale or manipulated.
5. **Payment amount precision:** PayHero receives `Math.floor(totalAmount)`, while the financial snapshot may retain fractional amounts.
6. **Webhook access and verification:** the order-payment webhook route is registered behind session authentication even though the provider callback is server-to-server. The payment service defines a signature-verification method, but the payment and wallet webhook handlers do not invoke it. If `PAYHERO_WEBHOOK_SECRET` is absent, the method itself would allow verification to be skipped.
7. **Callback URL fallback:** payment callback URLs fall back to port 4400 in controller code; the README describes port 5100. Correct operation depends on the configured backend URL and deployment routing.
8. **Location estimate differences:** address creation estimates distances from active hubs and returns the nearest hub's summary. Checkout preview routes to each store in the basket and uses the furthest route. Discovery also has a separate Mapbox estimate hook with store-specific preparation buffers.
9. **Rider dashboard sample metrics:** earnings, drop counts, and completion rate are derived from order data. On-time rate, acceptance rate, and satisfaction rank are currently fixed display values.
10. **Withdrawal UI:** withdrawal is represented in wallet UI/state and schema, but no backend withdrawal endpoint or provider payout workflow is registered. The current frontend store's withdrawal action adjusts only local state.
11. **Unavailable-item replacement:** the rider endpoint implements the wallet refund path. Although customers can select `REPLACE`, the same endpoint does not perform an actual replacement workflow.
12. **Invitation expiry:** rider creation sets the initial activation token expiry to one minute, while resending an invitation sets it to 24 hours.
13. **Older per-unit fee helper:** a compounding KES 10 per-item helper remains in the frontend, but the live backend checkout calculation uses the fixed KES 35 service fee.

## 11. Main code reference map

- Frontend route and layout: `frontend/src/App.tsx`
- Customer discovery/cart/checkout: `frontend/src/Pages/Discovery.tsx`, `frontend/src/Pages/Cart.tsx`, `frontend/src/Components/Pages/CheckoutModal.tsx`
- Location selection: `frontend/src/Components/Pages/Maps.tsx`
- Shared price and geofence rules: `shared/constants.ts`, `shared/geofence.ts`
- Pricing calculations: `backend/src/Utils/costCalculation.ts`
- Checkout/payment flow: `backend/src/Controllers/paymentController.ts`, `backend/src/Services/paymentService.ts`
- Wallet: `backend/src/Controllers/UserControllers/userWallet.ts`
- Rider workflow: `backend/src/Controllers/ridersController.ts`, `backend/src/Services/telegramService.ts`
- Admin APIs: `backend/src/Controllers/AdminControllers/`
- Database schema: `backend/prisma/schema.prisma`
