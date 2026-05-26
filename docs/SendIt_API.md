# SendIt — API Documentation

> Version 1.0 · 2026

---

## Global conventions

All endpoints follow a standard REST structure unless explicitly noted as an exception:

```
GET    /{resource}       — list all (with filters, search, pagination)
GET    /{resource}/:id   — get single item by ID
POST   /{resource}       — create new item
PUT    /{resource}/:id   — update item by ID (full or partial)
DELETE /{resource}/:id   — delete item by ID
```

**Authentication:** all endpoints (except public auth routes) require a valid JWT access token in the `Authorization: Bearer <token>` header.

**Ownership:** all user-scoped endpoints automatically filter by the authenticated user's ID. A user can never access or modify another user's data.

**Error format:**
```json
{
  "statusCode": 400,
  "error": "BAD_REQUEST",
  "message": "Human-readable description"
}
```

---

## Table of Contents

1. [Auth — User](#1-auth--user)
2. [Auth — Admin](#2-auth--admin)
3. [Profile — User](#3-profile--user)
4. [Profile — Admin](#4-profile--admin)
5. [Postal Connections](#5-postal-connections)
6. [Subscriptions](#6-subscriptions)
7. [Billing](#7-billing)
8. [Shipments](#8-shipments)
9. [Drafts](#9-drafts)
10. [Templates](#10-templates)
11. [Recipients](#11-recipients)
12. [Notifications](#12-notifications)
13. [Onboarding](#13-onboarding)
14. [Admin — Users](#14-admin--users)
15. [Admin — Subscriptions](#15-admin--subscriptions)
16. [Admin — Support](#16-admin--support)
17. [Admin — Services](#17-admin--services)
18. [Admin — Admins](#18-admin--admins)

---

## 1. Auth — User

**Role:** handles registration, login, token refresh, and logout for `CLIENT` users. This is the entry point for all client-side authentication. Tokens use JWT — a short-lived access token paired with a longer-lived refresh token stored securely.

---

### `POST /auth/register`

**Purpose:** register a new organization account.

**Receives:**
```json
{
  "email": "company@example.com",
  "password": "securePassword123",
  "phone": "+380501234567"
}
```

**Logic:** validates that email and phone are unique, hashes the password, creates a `User` record with `status: INACTIVE` and a `UserCredentials` record. Sends a verification email *(future — when email service is connected)*. Currently sets status to `ACTIVE` immediately.

**Returns:** `201 Created`
```json
{
  "id": 1,
  "email": "company@example.com",
  "status": "ACTIVE"
}
```

**Errors:** `409` if email or phone already exists.

---

### `POST /auth/login`

**Purpose:** authenticate a client user and issue tokens.

**Receives:**
```json
{
  "email": "company@example.com",
  "password": "securePassword123",
  "totpCode": "123456"
}
```

`totpCode` is required only if the user has 2FA enabled. If 2FA is enabled and `totpCode` is missing, returns `403 TWO_FACTOR_REQUIRED`.

**Logic:** validates credentials, checks `User.status` (rejects `BANNED`, `DELETED`, `INACTIVE`). If user status is `DELETED` and within the 30-day window — allows login but flags response so frontend can show the account recovery screen. Validates TOTP code if 2FA is active.

**Returns:** `200 OK`
```json
{
  "accessToken": "eyJ...",
  "refreshToken": "eyJ...",
  "user": {
    "id": 1,
    "email": "company@example.com",
    "status": "ACTIVE",
    "scheduledForDeletion": false
  }
}
```

**Errors:** `401` invalid credentials, `403 TWO_FACTOR_REQUIRED`, `403 ACCOUNT_BANNED`, `403 ACCOUNT_DELETED` (past 30-day window).

---

### `POST /auth/refresh`

**Purpose:** issue a new access token using a valid refresh token.

**Receives:**
```json
{ "refreshToken": "eyJ..." }
```

**Logic:** validates the refresh token hash against `RefreshToken` table. Checks that `revokedAt` is null and `expiresAt` has not passed. Issues a new access token (and optionally rotates the refresh token).

**Returns:** `200 OK`
```json
{ "accessToken": "eyJ..." }
```

**Errors:** `401` if token is invalid, expired, or revoked.

---

### `POST /auth/logout`

**Purpose:** invalidate the current refresh token (end session).

**Receives:**
```json
{ "refreshToken": "eyJ..." }
```

**Logic:** sets `RefreshToken.revokedAt = now()` for the provided token. Access token is short-lived and expires naturally.

**Returns:** `204 No Content`

---

### `PUT /auth/password`

**Purpose:** change the authenticated user's password.

**Receives:**
```json
{
  "currentPassword": "oldPassword",
  "newPassword": "newSecurePassword"
}
```

**Logic:** verifies `currentPassword` against stored hash. Updates `UserCredentials.passwordHash`. Revokes all existing refresh tokens to force re-login on other devices.

**Returns:** `200 OK`
```json
{ "message": "Password updated successfully" }
```

**Errors:** `401` if `currentPassword` is wrong.

---

### `POST /auth/2fa/setup`

**Purpose:** generate a TOTP secret and QR code for 2FA setup.

**Receives:** nothing (uses authenticated user's identity).

**Logic:** generates a new TOTP secret using a library (e.g. `speakeasy`). Does NOT save it to DB yet — only returns it for the user to scan. The secret is saved only after successful verification via `/auth/2fa/verify`.

**Returns:** `200 OK`
```json
{
  "qrCodeUrl": "otpauth://totp/SendIt:user@example.com?secret=XXXX&issuer=SendIt",
  "manualKey": "XXXX XXXX XXXX XXXX"
}
```

---

### `POST /auth/2fa/verify`

**Purpose:** verify the TOTP code and permanently enable 2FA.

**Receives:**
```json
{
  "secret": "XXXXXXXXXXXXXXXX",
  "totpCode": "123456"
}
```

**Logic:** validates the `totpCode` against the provided `secret`. If valid — saves the encrypted `secret` to `TwoFactorAuth` record, sets `isEnabled: true`.

**Returns:** `200 OK`
```json
{ "message": "Two-factor authentication enabled" }
```

**Errors:** `400 INVALID_TOTP_CODE` if code does not match.

---

### `DELETE /auth/2fa`

**Purpose:** disable 2FA for the authenticated client user.

**Receives:**
```json
{ "totpCode": "123456" }
```

**Logic:** validates the `totpCode` against the stored secret. If valid — sets `TwoFactorAuth.isEnabled: false` and clears the secret.

**Returns:** `204 No Content`

**Errors:** `400 INVALID_TOTP_CODE`.

---

## 2. Auth — Admin

**Role:** handles login and token lifecycle for `ADMIN` and `SUPER_ADMIN` roles. Admins cannot self-register — they are invited via `AdminInvite`. The flow includes invite acceptance, initial password setup, and mandatory 2FA setup for `ADMIN` role.

---

### `GET /admin/auth/invite/:token`

**Purpose:** validate an invite token before showing the registration form.

**Receives:** `token` in URL path.

**Logic:** looks up `AdminInvite` by token, checks that `usedAt` is null and `expiresAt` has not passed.

**Returns:** `200 OK`
```json
{
  "email": "admin@sendit.com",
  "valid": true
}
```

**Errors:** `404` if token not found, `410 INVITE_EXPIRED` if past expiry, `409 INVITE_ALREADY_USED`.

---

### `POST /admin/auth/register`

**Purpose:** complete admin registration using a valid invite token.

**Receives:**
```json
{
  "inviteToken": "abc123...",
  "firstName": "John",
  "lastName": "Doe",
  "password": "securePassword"
}
```

**Logic:** validates invite token, creates `Admin` record with `status: ACTIVE`, creates `AdminCredentials`. Marks `AdminInvite.usedAt = now()`. Returns tokens. For `ADMIN` role — frontend must redirect to `/admin/onboarding/2fa-setup` before granting dashboard access.

**Returns:** `201 Created`
```json
{
  "accessToken": "eyJ...",
  "refreshToken": "eyJ...",
  "admin": {
    "id": 1,
    "role": "ADMIN",
    "requiresTwoFactorSetup": true
  }
}
```

---

### `POST /admin/auth/login`

**Purpose:** authenticate an admin user.

**Receives:**
```json
{
  "email": "admin@sendit.com",
  "password": "securePassword",
  "totpCode": "123456"
}
```

**Logic:** same as user login. `totpCode` required for `ADMIN` (mandatory 2FA). `SUPER_ADMIN` does not require TOTP.

**Returns:** `200 OK` — same shape as user login response.

---

### `POST /admin/auth/refresh`

**Purpose:** refresh admin access token. Same logic as user refresh but uses `AdminRefreshToken`.

**Returns:** `200 OK` — `{ "accessToken": "eyJ..." }`

---

### `POST /admin/auth/logout`

**Purpose:** invalidate admin refresh token.

**Returns:** `204 No Content`

---

### `PUT /admin/auth/password`

**Purpose:** change admin password. Same logic as user password change.

**Returns:** `200 OK`

---

### `POST /admin/auth/2fa/setup`

**Purpose:** generate TOTP secret for mandatory admin 2FA setup (called during onboarding).

**Returns:** `200 OK` — same shape as user 2FA setup response.

---

### `POST /admin/auth/2fa/verify`

**Purpose:** verify and enable mandatory 2FA for admin during onboarding.

**Logic:** same as user verify. After success, sets a flag that 2FA onboarding is complete — admin can now access the dashboard.

**Returns:** `200 OK`

---

## 3. Profile — User

**Role:** manages the authenticated client's profile data — organization information, app preferences, and notification settings. This module does not handle subscription, card, 2FA, operators, or account deletion — those have their own modules.

---

### `GET /profile`

**Purpose:** fetch the full profile of the authenticated client.

**Receives:** nothing (identity from JWT).

**Logic:** fetches `User` with joined `UserProfile`, returns all organization fields plus app settings and notification preferences.

**Returns:** `200 OK`
```json
{
  "id": 1,
  "email": "company@example.com",
  "phone": "+380501234567",
  "avatarUrl": null,
  "profile": {
    "companyName": "Acme LLC",
    "companyNameLat": "Acme LLC",
    "ownershipForm": "ТОВ",
    "edrpou": "12345678",
    "taxNumber": "1234567890",
    "legalAddress": "Kyiv, ...",
    "contactPersonName": "John Doe"
  },
  "settings": {
    "language": "uk",
    "timezone": "Europe/Kyiv",
    "dateFormat": "DD.MM.YYYY"
  },
  "notifications": {
    "subscription": true,
    "postalConnection": true,
    "account": true,
    "system": true,
    "email": false
  }
}
```

---

### `PUT /profile`

**Purpose:** update organization data (inline edit save).

**Receives:** any subset of editable fields (EDRPOU is ignored even if sent):
```json
{
  "companyName": "New Name LLC",
  "phone": "+380509999999",
  "contactPersonName": "Jane Doe"
}
```

**Logic:** updates `User` and `UserProfile` records. EDRPOU field is silently ignored — it cannot be changed after registration.

**Returns:** `200 OK` — updated profile object (same shape as `GET /profile`).

---

### `PUT /profile/settings`

**Purpose:** update DB-stored app settings and notification preferences in a single call.

**Receives:** any subset of settings fields:
```json
{
  "language": "en",
  "timezone": "Europe/London",
  "dateFormat": "MM/DD/YYYY",
  "notifications": {
    "subscription": false,
    "system": false
  }
}
```

**Logic:** updates the corresponding fields on `User`. `notifications.account` is silently ignored — it cannot be disabled. `notifications.email` is accepted but has no effect until email service is integrated.

**Returns:** `200 OK` — updated settings object.

---

### `DELETE /users/me`

**Purpose:** schedule the authenticated user's account for deletion.

**Receives:** nothing.

**Logic:** sets `User.status = DELETED` and `User.scheduledDeletionAt = now() + 30 days`. Revokes all refresh tokens (forces logout). Creates an `ACCOUNT` notification. Does not hard-delete anything — a cron job handles that after 30 days.

**Returns:** `204 No Content`

---

### `POST /users/me/restore`

**Purpose:** cancel a pending account deletion within the 30-day window.

**Receives:** nothing (identity from JWT — user must still be able to log in during the window).

**Logic:** sets `User.status = ACTIVE`, clears `User.scheduledDeletionAt`. Creates an `ACCOUNT` notification confirming cancellation.

**Returns:** `200 OK`
```json
{ "message": "Account deletion cancelled" }
```

**Errors:** `400` if account is not in `DELETED` status or the 30-day window has passed.

---

## 4. Profile — Admin

**Role:** manages admin personal data and app preferences. Simpler than client profile — no subscription, no operators, no danger zone.

---

### `GET /admin/profile`

**Purpose:** fetch the authenticated admin's profile.

**Returns:** `200 OK`
```json
{
  "id": 1,
  "email": "admin@sendit.com",
  "firstName": "John",
  "lastName": "Doe",
  "role": "ADMIN",
  "avatarUrl": null,
  "invitedBy": {
    "id": 2,
    "firstName": "Super",
    "lastName": "Admin",
    "email": "superadmin@sendit.com"
  },
  "twoFactorEnabled": true,
  "settings": {
    "language": "uk",
    "timezone": "Europe/Kyiv",
    "dateFormat": "DD.MM.YYYY"
  }
}
```

`invitedBy` is `null` for the first `SUPER_ADMIN`.

---

### `PUT /admin/profile`

**Purpose:** update admin personal info. Only `firstName`, `lastName`, `avatarUrl` are editable — email is permanently locked.

**Receives:**
```json
{
  "firstName": "John",
  "lastName": "Smith"
}
```

**Returns:** `200 OK` — updated profile object.

---

### `PUT /admin/profile/settings`

**Purpose:** update admin app settings (language, timezone, date format).

**Receives:**
```json
{
  "language": "en",
  "timezone": "Europe/London"
}
```

**Returns:** `200 OK` — updated settings object.

---

## 5. Postal Connections

**Role:** manages the links between a client's account and external postal operators via API keys. Each connection stores an encrypted API key that SendIt uses on the user's behalf to create shipments and fetch data from the operator's API. A user can have at most one connection per operator. The number of active connections is limited by the user's subscription plan.

---

### `GET /postal-connections`

**Purpose:** fetch all postal connections for the authenticated user, regardless of status.

**Receives:** nothing.

**Logic:** returns all `UserPostalConnection` records for the current user, joined with `PostalService` details. API keys are **never** returned.

**Returns:** `200 OK`
```json
{
  "connections": [
    {
      "id": 1,
      "postalService": {
        "id": 1,
        "name": "Nova Poshta",
        "slug": "nova-poshta",
        "logoUrl": "https://..."
      },
      "status": "ACTIVE",
      "connectedAt": "2026-01-15T10:00:00Z",
      "updatedAt": "2026-01-15T10:00:00Z"
    }
  ]
}
```

---

### `POST /postal-connections/nova-poshta`

**Purpose:** connect a Nova Poshta account using an API key.

**Receives:**
```json
{ "apiKey": "your-nova-poshta-api-key" }
```

**Logic:** checks that no connection for Nova Poshta already exists for this user (returns `409` if it does — use `PUT` instead). Checks active connection count against `plan.maxOperators` (returns `403 OPERATOR_LIMIT_REACHED` if exceeded). Encrypts the API key and saves a new `UserPostalConnection` record with `status: ACTIVE`. The key is considered valid by the fact that the user obtained it from Nova Poshta — no test request is made at connect time.

**Returns:** `201 Created` — connection object (without API key).

**Errors:** `409 CONNECTION_ALREADY_EXISTS`, `403 OPERATOR_LIMIT_REACHED`.

---

### `PUT /postal-connections/nova-poshta`

**Purpose:** update (overwrite) the Nova Poshta API key. Resets connection status to `ACTIVE` regardless of previous status (`BLOCKED`, `INVALID`).

**Receives:**
```json
{ "apiKey": "new-nova-poshta-api-key" }
```

**Logic:** finds the existing `UserPostalConnection` for Nova Poshta. Encrypts and overwrites the key, sets `status: ACTIVE`, updates `updatedAt`.

**Returns:** `200 OK` — updated connection object.

**Errors:** `404 CONNECTION_NOT_FOUND` if no connection exists (use `POST` first).

---

### `DELETE /postal-connections/nova-poshta`

**Purpose:** permanently remove the Nova Poshta connection.

**Receives:** nothing.

**Logic:** hard-deletes the `UserPostalConnection` record. The record is gone entirely — there is no soft delete or `DISCONNECTED` status.

**Returns:** `204 No Content`

**Errors:** `404` if no connection exists.

> Future operators (`/postal-connections/ukrposhta`, `/postal-connections/mist`) follow identical patterns.

---

## 6. Subscriptions

**Role:** manages client subscription plans — current state, scheduled changes, upgrades, downgrades, and cancellations. All plan changes (except admin overrides) take effect at the start of the next billing period, never immediately. This module also enforces operator connection limits when the plan changes.

---

### `GET /subscriptions/plans`

**Purpose:** fetch all available subscription plans.

**Receives:** nothing.

**Logic:** returns all `SubscriptionPlan` records where `isActive: true`.

**Returns:** `200 OK`
```json
{
  "plans": [
    {
      "id": 1,
      "level": "FREE",
      "name": "Free",
      "price": "0.00",
      "maxOperators": 1,
      "description": "..."
    }
  ]
}
```

---

### `GET /subscriptions/me`

**Purpose:** fetch the current user's active subscription with full plan details.

**Returns:** `200 OK`
```json
{
  "id": 1,
  "status": "ACTIVE",
  "plan": { "level": "PRO", "name": "Pro", "price": "299.00" },
  "currentPeriodStart": "2026-05-01T00:00:00Z",
  "currentPeriodEnd": "2026-05-31T23:59:59Z",
  "nextPlan": null,
  "cancelledAt": null
}
```

---

### `PUT /subscriptions/me`

**Purpose:** change the subscription — upgrade, downgrade, cancel, or revert a pending change. All operations go through a single endpoint by sending the desired state.

**Receives:**
```json
{
  "action": "upgrade",
  "planId": 2
}
```

Possible `action` values:

| Action | Description |
|--------|-------------|
| `upgrade` | Schedule upgrade to a higher plan. Requires `planId`. Takes effect next period. |
| `downgrade` | Schedule downgrade to a lower plan. Requires `planId`. Takes effect next period. |
| `cancel` | Cancel current paid subscription. Remains active until period end, then moves to FREE. |
| `revert` | Cancel a pending upgrade or downgrade before it activates. |

**Logic:** validates the requested action is valid for the current status. Sets `nextPlanId` and updates `status` to `PENDING_UPGRADE` or `PENDING_DOWNGRADE` accordingly. For `cancel` — sets `status: CANCELLED` and `cancelledAt: now()`. For `revert` — clears `nextPlanId` and resets `status: ACTIVE`.

**Returns:** `200 OK` — updated subscription object.

**Errors:** `400` if action is invalid for current status (e.g. trying to upgrade when already `PENDING_UPGRADE`).

---

## 7. Billing

**Role:** manages mock payment card data and provides the client's billing history — a log of all subscription charges. Since this is a learning project, no real payment processing occurs. All charges are simulated by the subscription renewal cron job.

---

### `GET /billing`

**Purpose:** fetch paginated billing history for the authenticated user.

**Receives:** query params: `page`, `limit`.

**Returns:** `200 OK`
```json
{
  "data": [
    {
      "id": 1,
      "plan": { "name": "Pro", "level": "PRO" },
      "amount": "299.00",
      "status": "PAID",
      "periodStart": "2026-05-01T00:00:00Z",
      "periodEnd": "2026-05-31T23:59:59Z",
      "paidAt": "2026-05-01T00:00:01Z"
    }
  ],
  "total": 12,
  "page": 1,
  "limit": 25
}
```

---

### `POST /billing/card`

**Purpose:** save mock payment card data. Used when no card is currently saved.

**Receives:**
```json
{
  "cardNumber": "4242424242424242",
  "expiryMonth": "12",
  "expiryYear": "2028",
  "cardholderName": "ACME LLC"
}
```

**Logic:** stores masked card number (last 4 digits only) and expiry. Raw card number is never persisted. This is a mock — no actual payment gateway is called.

**Returns:** `201 Created`
```json
{
  "maskedNumber": "•••• •••• •••• 4242",
  "expiryMonth": "12",
  "expiryYear": "2028"
}
```

**Errors:** `409` if a card is already saved — use `PUT /billing/card`.

---

### `PUT /billing/card`

**Purpose:** update existing mock card data.

**Receives:** same as `POST /billing/card`.

**Returns:** `200 OK` — updated masked card object.

---

### `DELETE /billing/card`

**Purpose:** remove saved card data.

**Returns:** `204 No Content`

---

## 8. Shipments

**Role:** the central module for fetching and displaying shipments from external postal operators. SendIt does not store shipment data locally (except drafts) — it acts as an aggregator, fetching data from each operator's API using the user's stored and encrypted API key. Shipment status normalization (raw operator status → unified SendIt status) is handled server-side before returning data to the client.

---

### `GET /shipments`

**Purpose:** fetch all shipments for the current user across all connected operators, merged into a single list. Drafts from the local DB are included.

**Receives:** query params:
- `operator` — filter by operator slug (e.g. `nova-poshta`)
- `status` — filter by normalized status (e.g. `IN_TRANSIT`, `DRAFT`)
- `ttn` — search by tracking number
- `dateFrom`, `dateTo` — creation date range
- `valueFrom`, `valueTo` — declared value range
- `page`, `limit`

**Logic:** for each of the user's `ACTIVE` postal connections, fetches shipments from the respective operator API in parallel. Applies status normalization (raw → `ShipmentStatus` enum) via hardcoded per-operator mappers. Merges results with local drafts. Applies filters and pagination on the merged result. If an operator API call fails with an auth error, marks that connection as `INVALID` and creates a `POSTAL_CONNECTION` notification — the rest of the operators still return their data.

**Returns:** `200 OK`
```json
{
  "data": [
    {
      "ttn": "59000000000001",
      "operator": { "name": "Nova Poshta", "slug": "nova-poshta" },
      "status": "IN_TRANSIT",
      "rawStatus": "Відправлення в дорозі",
      "recipient": "John Doe",
      "createdAt": "2026-05-10T12:00:00Z",
      "declaredValue": "500.00",
      "isDraft": false
    }
  ],
  "total": 42,
  "page": 1,
  "limit": 25
}
```

---

### `GET /shipments/nova-poshta`

**Purpose:** fetch shipments from Nova Poshta only. Used for selective cache refresh after creating a new shipment via Nova Poshta — avoids refetching all operators.

**Receives:** same filter query params as `GET /shipments`.

**Returns:** `200 OK` — same shape, only Nova Poshta shipments.

---

### `GET /shipments/:ttn`

**Purpose:** fetch full details of a single shipment by TTN from the relevant operator's API.

**Receives:** `ttn` in URL path. The operator is inferred from the TTN format or from the active connections.

**Logic:** identifies which operator the TTN belongs to, fetches full shipment details from that operator's API, normalizes the status, and returns all available fields.

**Returns:** `200 OK`
```json
{
  "ttn": "59000000000001",
  "operator": { "name": "Nova Poshta", "slug": "nova-poshta" },
  "status": "IN_TRANSIT",
  "rawStatus": "Відправлення в дорозі",
  "recipient": {
    "name": "John Doe",
    "phone": "+380501234567",
    "address": "Kyiv, branch #42"
  },
  "weight": 1.5,
  "declaredValue": "500.00",
  "shipmentType": "PACKAGE",
  "statusHistory": [
    { "status": "CREATED", "rawStatus": "Створено", "timestamp": "2026-05-10T10:00:00Z" },
    { "status": "IN_TRANSIT", "rawStatus": "Відправлення в дорозі", "timestamp": "2026-05-11T08:00:00Z" }
  ]
}
```

---

### `POST /shipments/nova-poshta`

**Purpose:** create a new shipment via Nova Poshta API.

**Receives:** shipment form data (fields defined by Nova Poshta API — to be documented separately once NP API docs are reviewed):
```json
{
  "recipientName": "John Doe",
  "recipientPhone": "+380501234567",
  "cityRef": "...",
  "warehouseRef": "...",
  "weight": 1.5,
  "declaredValue": 500,
  "description": "Electronics"
}
```

**Logic:** fetches the user's Nova Poshta API key from `UserPostalConnection` (decrypts it). Sends a create request to the NP API. If NP returns an auth error — marks connection as `INVALID`, creates a notification, returns `422 CONNECTION_INVALID`. On success — returns the TTN and initial status from NP. If a `templateId` was provided in the request, increments `ShipmentTemplate.usageCount`.

**Returns:** `201 Created`
```json
{
  "ttn": "59000000000099",
  "status": "CREATED",
  "rawStatus": "Створено"
}
```

**Errors:** `422 CONNECTION_INVALID`, `400 VALIDATION_ERROR` (operator rejected the data), `503 OPERATOR_UNAVAILABLE`.

---

## 9. Drafts

**Role:** manages locally stored incomplete shipment forms. A draft is a shipment that has been started but not yet submitted to any postal operator. Unlike real shipments, drafts are stored entirely in SendIt's database and have no TTN. They appear in the shipments table with a `DRAFT` status badge.

---

### `GET /drafts`

**Purpose:** fetch all drafts for the current user.

**Returns:** `200 OK`
```json
{
  "data": [
    {
      "id": 1,
      "postalService": { "name": "Nova Poshta", "slug": "nova-poshta" },
      "formData": { "recipientName": "...", "weight": 1.5 },
      "createdAt": "2026-05-10T09:00:00Z",
      "updatedAt": "2026-05-10T09:30:00Z"
    }
  ]
}
```

---

### `GET /drafts/:id`

**Purpose:** fetch a single draft by ID. Used when opening the form to continue editing a draft.

**Returns:** `200 OK` — full draft object including all saved `formData` fields.

**Errors:** `404` if not found, `403` if draft belongs to another user.

---

### `POST /drafts`

**Purpose:** save a new draft from a partially filled shipment form.

**Receives:**
```json
{
  "postalServiceId": 1,
  "formData": {
    "recipientName": "John Doe",
    "weight": 1.5
  }
}
```

`postalServiceId` is nullable — a draft can be saved even before an operator is selected.

**Returns:** `201 Created` — created draft object.

---

### `PUT /drafts/:id`

**Purpose:** update an existing draft (auto-save or manual save).

**Receives:** same shape as `POST /drafts` — any updated fields.

**Returns:** `200 OK` — updated draft object.

---

### `DELETE /drafts/:id`

**Purpose:** delete a draft. Called automatically after a draft is successfully submitted as a real shipment, or manually by the user.

**Returns:** `204 No Content`

---

## 10. Templates

**Role:** manages reusable shipment form presets. A template is an intentionally saved configuration for repeated use — unlike drafts which are incomplete in-progress forms. Templates are stored locally in SendIt's database and are never submitted to postal operators. They appear in the `/templates` page and can be applied to the shipment creation form to prefill fields.

---

### `GET /templates`

**Purpose:** fetch all templates for the current user.

**Receives:** query params:
- `operator` — filter by postal operator slug
- `shipmentType` — filter by normalized type (`DOCUMENT`, `PACKAGE`, etc.)
- `search` — text search in name and description
- `sortBy` — `createdAt` (default) or `name`
- `sortOrder` — `asc` or `desc`
- `page`, `limit`

**Returns:** `200 OK`
```json
{
  "data": [
    {
      "id": 1,
      "name": "Nova Poshta · Package · 2026-05-14",
      "description": "Standard client shipment",
      "postalService": { "name": "Nova Poshta", "slug": "nova-poshta" },
      "shipmentType": "PACKAGE",
      "usageCount": 12,
      "createdAt": "2026-05-14T10:00:00Z"
    }
  ],
  "total": 8,
  "page": 1,
  "limit": 25
}
```

---

### `GET /templates/:id`

**Purpose:** fetch a single template with full `templateData` for use in the form prefill.

**Returns:** `200 OK` — full template object including all `templateData` fields.

---

### `POST /templates`

**Purpose:** create a new template. Used both from `/templates/new` page and from the "Save as template" modal in the shipment creation form. Also handles duplication — to duplicate a template, send a `POST` with the source template's data and a modified name.

**Receives:**
```json
{
  "name": "Nova Poshta · Package · 2026-05-14",
  "description": "Optional description",
  "postalServiceId": 1,
  "shipmentType": "PACKAGE",
  "templateData": {
    "weight": 1.5,
    "declaredValue": 500
  }
}
```

**Returns:** `201 Created` — created template object.

---

### `PUT /templates/:id`

**Purpose:** update an existing template. Also used to increment `usageCount` when a shipment is created from this template (send `{ "usageCount": <current + 1> }`).

**Receives:** any subset of template fields.

**Returns:** `200 OK` — updated template object.

---

### `DELETE /templates/:id`

**Purpose:** permanently delete a template. Shipments previously created using this template are unaffected — the template reference is simply unlinked.

**Returns:** `204 No Content`

---

## 11. Recipients

**Role:** manages the address book of saved recipients. Clients can save frequent contacts (organizations or individuals) with optional delivery addresses. Saved recipients can be applied to the shipment creation form to prefill recipient fields and delivery address in one click.

---

### `GET /recipients`

**Purpose:** fetch all recipients for the current user.

**Receives:** query params:
- `type` — filter by `ORGANIZATION` or `INDIVIDUAL`
- `search` — text search across name, company name, phone, email
- `sortBy`, `sortOrder`
- `page`, `limit`

**Returns:** `200 OK`
```json
{
  "data": [
    {
      "id": 1,
      "type": "ORGANIZATION",
      "companyName": "Acme LLC",
      "lastName": "Doe",
      "firstName": "John",
      "patronymic": "Ivan",
      "phone": "+380501234567",
      "email": "john@acme.com",
      "note": "Warehouse entrance from the back",
      "address": {
        "type": "BRANCH",
        "city": "Kyiv",
        "branchNumber": "42"
      }
    }
  ],
  "total": 15,
  "page": 1,
  "limit": 25
}
```

---

### `GET /recipients/:id`

**Purpose:** fetch a single recipient by ID. Used when opening the view/edit modal.

**Returns:** `200 OK` — full recipient object.

---

### `POST /recipients`

**Purpose:** create a new recipient.

**Receives:**
```json
{
  "type": "ORGANIZATION",
  "companyName": "Acme LLC",
  "ownershipForm": "ТОВ",
  "edrpou": "12345678",
  "lastName": "Doe",
  "firstName": "John",
  "patronymic": "Ivan",
  "phone": "+380501234567",
  "email": "john@acme.com",
  "note": "Warehouse entrance from the back",
  "address": {
    "type": "BRANCH",
    "city": "Kyiv",
    "branchNumber": "42"
  }
}
```

`address` is optional. `type` determines which fields are required.

**Returns:** `201 Created` — created recipient object.

---

### `PUT /recipients/:id`

**Purpose:** update an existing recipient. Any field can be updated including the delivery address.

**Receives:** any subset of recipient fields.

**Returns:** `200 OK` — updated recipient object.

---

### `DELETE /recipients/:id`

**Purpose:** permanently delete a recipient. Shipments previously sent to this recipient are unaffected.

**Returns:** `204 No Content`

---

## 12. Notifications

**Role:** delivers in-app system notifications to clients about important platform events (subscription changes, connection issues, account lifecycle). Notifications are created internally by other modules — clients cannot create them manually. This module provides endpoints to fetch, mark as read, and delete notifications.

---

### `GET /notifications`

**Purpose:** fetch notifications for the current user.

**Receives:** query params:
- `tab` — `unread` (only `isRead: false`) or `all` (default)
- `page`, `limit`

**Returns:** `200 OK`
```json
{
  "data": [
    {
      "id": 1,
      "type": "SUBSCRIPTION",
      "title": "Plan upgraded",
      "body": "Your plan has been changed to PRO starting 2026-06-01.",
      "isRead": false,
      "createdAt": "2026-05-15T10:00:00Z"
    }
  ],
  "total": 5,
  "page": 1,
  "limit": 25
}
```

---

### `GET /notifications/unread-count`

**Purpose:** returns the count of unread notifications. Used by the header bell badge. Polled every 60 seconds by the frontend.

**Returns:** `200 OK`
```json
{ "count": 3 }
```

---

### `PUT /notifications/:id`

**Purpose:** mark a single notification as read.

**Receives:**
```json
{ "isRead": true }
```

**Returns:** `200 OK` — updated notification object.

---

### `PUT /notifications`

**Purpose:** mark all unread notifications as read in a single call.

**Receives:** nothing (acts on all unread for the current user).

**Returns:** `200 OK`
```json
{ "updated": 5 }
```

---

### `DELETE /notifications/:id`

**Purpose:** immediately delete a single notification.

**Returns:** `204 No Content`

---

### `DELETE /notifications`

**Purpose:** bulk delete notifications. Behavior depends on query param.

**Receives:** query param `filter`:
- `filter=read` — delete all read notifications
- *(no filter)* — delete all notifications for the current user

**Returns:** `204 No Content`

---

## 13. Onboarding

**Role:** provides the state of the new user onboarding checklist shown on the dashboard after registration. This is a lightweight read-only module — the checklist state is computed server-side by checking existing records across multiple tables.

---

### `GET /onboarding/checklist`

**Purpose:** returns the completion state of each onboarding step for the current user.

**Logic:**
- `profileCompleted` → `User.profileCompleted === true`
- `operatorConnected` → count of `ACTIVE` `UserPostalConnection` records > 0
- `firstShipmentCreated` → count of shipments from operators + drafts > 0

**Returns:** `200 OK`
```json
{
  "profileCompleted": true,
  "operatorConnected": false,
  "firstShipmentCreated": false
}
```

---

## 14. Admin — Users

**Role:** allows admins to view and manage all client accounts. Admins can view full profile details, change account status (block, unblock), and see each user's subscription and support history. Admins cannot change passwords or impersonate users.

---

### `GET /admin/users`

**Purpose:** fetch paginated list of all client accounts.

**Receives:** query params:
- `plan` — filter by subscription level (`FREE`, `PRO`, `BUSINESS`)
- `status` — filter by `UserStatus`
- `search` — search by company name or email
- `sortBy`, `sortOrder`
- `page`, `limit`

**Returns:** `200 OK`
```json
{
  "data": [
    {
      "id": 1,
      "email": "company@example.com",
      "status": "ACTIVE",
      "companyName": "Acme LLC",
      "plan": "PRO",
      "createdAt": "2026-01-01T00:00:00Z"
    }
  ],
  "total": 120,
  "page": 1,
  "limit": 25
}
```

---

### `GET /admin/users/:id`

**Purpose:** fetch full details of a single client — profile, subscription, connected operators, and support ticket count.

**Returns:** `200 OK` — full user object with nested profile, subscription, and connections.

---

### `PUT /admin/users/:id`

**Purpose:** update a client's account status. Used to block, unblock, or temporarily block an account.

**Receives:**
```json
{ "status": "BANNED" }
```

Allowed values: `ACTIVE`, `BANNED`, `INACTIVE`.

**Returns:** `200 OK` — updated user object.

---

## 15. Admin — Subscriptions

**Role:** allows admins to view all subscriptions platform-wide and perform manual overrides — changing a user's plan immediately (bypassing the next-period logic), extending a subscription, cancelling it, or setting an individual discount. These actions bypass normal client-side rules and take effect immediately.

---

### `GET /admin/subscriptions`

**Purpose:** fetch paginated list of all subscriptions.

**Receives:** query params: `plan`, `status`, `search` (company name), `page`, `limit`.

**Returns:** `200 OK` — paginated list of subscription objects with user info.

---

### `GET /admin/subscriptions/:id`

**Purpose:** fetch details of a single subscription.

**Returns:** `200 OK` — full subscription object with user and plan details.

---

### `PUT /admin/subscriptions/:id`

**Purpose:** perform any admin override on a subscription — plan change, extension, cancellation, or discount. All operations go through a single endpoint.

**Receives:**
```json
{
  "action": "changePlan",
  "planId": 3
}
```

Possible `action` values:

| Action | Required fields | Description |
|--------|----------------|-------------|
| `changePlan` | `planId` | Immediately switch to a different plan (skips next-period logic) |
| `extend` | — | Extend `currentPeriodEnd` by one month |
| `cancel` | — | Force cancel subscription — moves to FREE at period end |
| `setDiscount` | `discountAmount`, `discountType` | Set individual discount for next billing cycle (`ONE_TIME` or `PERMANENT`) |

**Returns:** `200 OK` — updated subscription object.

---

## 16. Admin — Support

**Role:** allows admins to manage and respond to client support tickets. Each ticket is a conversation thread between one client and one or more admins. Admins can view all tickets, respond to open ones, and close tickets (making them read-only for both sides).

---

### `GET /admin/support/tickets`

**Purpose:** fetch paginated list of all support tickets.

**Receives:** query params: `status` (`OPEN`, `CLOSED`), `search` (by subject or company), `page`, `limit`.

**Returns:** `200 OK` — list of tickets with client info and last message preview.

---

### `GET /admin/support/tickets/:id`

**Purpose:** fetch full ticket details including all messages.

**Returns:** `200 OK` — ticket object with full message thread.

---

### `PUT /admin/support/tickets/:id`

**Purpose:** update ticket status — close an open ticket (sets it to read-only for both sides).

**Receives:**
```json
{ "status": "CLOSED" }
```

**Returns:** `200 OK` — updated ticket object.

---

### `POST /admin/support/messages`

**Purpose:** send a message in a support ticket thread.

**Receives:**
```json
{
  "ticketId": 1,
  "body": "Hello, here is the answer to your question..."
}
```

**Logic:** validates that the ticket is `OPEN` (returns `403 TICKET_CLOSED` if not). Creates a `SupportMessage` with `adminId` set to the authenticated admin's ID.

**Returns:** `201 Created` — created message object.

---

## 17. Admin — Services

**Role:** manages the catalogue of postal operators available in the system. This catalogue determines which operators clients can connect to. Only admins can add, activate, or deactivate operators. Deactivating an operator does not disconnect existing user connections — it only prevents new connections to that operator.

---

### `GET /admin/services`

**Purpose:** fetch all postal services in the system.

**Returns:** `200 OK`
```json
{
  "data": [
    {
      "id": 1,
      "name": "Nova Poshta",
      "slug": "nova-poshta",
      "logoUrl": "https://...",
      "isActive": true,
      "createdAt": "2026-01-01T00:00:00Z"
    }
  ]
}
```

---

### `GET /admin/services/:id`

**Purpose:** fetch details of a single postal service.

**Returns:** `200 OK` — full service object.

---

### `POST /admin/services`

**Purpose:** add a new postal operator to the system catalogue.

**Receives:**
```json
{
  "name": "Ukrposhta",
  "slug": "ukrposhta",
  "logoUrl": "https://..."
}
```

**Returns:** `201 Created` — created service object.

---

### `PUT /admin/services/:id`

**Purpose:** update a postal service — name, logo, or active status.

**Receives:**
```json
{ "isActive": false }
```

**Returns:** `200 OK` — updated service object.

---

### `DELETE /admin/services/:id`

**Purpose:** permanently remove a postal service from the catalogue. Only allowed if no active user connections exist for this service.

**Returns:** `204 No Content`

**Errors:** `409 SERVICE_HAS_ACTIVE_CONNECTIONS` if users are connected to this service.

---

## 18. Admin — Admins

**Role:** allows `SUPER_ADMIN` to manage the admin team — invite new admins, view existing ones, and deactivate or remove them. Regular `ADMIN` users cannot access this module. Admins cannot self-register — they can only join via an email invite sent by `SUPER_ADMIN`.

> **Access:** all endpoints in this section require `SUPER_ADMIN` role. Returns `403 FORBIDDEN` for regular `ADMIN`.

---

### `GET /admin/admins`

**Purpose:** fetch paginated list of all admins.

**Receives:** query params: `status`, `search` (by name or email), `page`, `limit`.

**Returns:** `200 OK`
```json
{
  "data": [
    {
      "id": 1,
      "email": "admin@sendit.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "ADMIN",
      "status": "ACTIVE",
      "invitedBy": { "id": 2, "email": "superadmin@sendit.com" },
      "createdAt": "2026-01-15T10:00:00Z"
    }
  ]
}
```

---

### `GET /admin/admins/:id`

**Purpose:** fetch details of a single admin.

**Returns:** `200 OK` — full admin object.

---

### `POST /admin/admins/invite`

**Purpose:** send an email invite to a new admin. Creates an `AdminInvite` record with a unique token and 7-day TTL.

**Receives:**
```json
{ "email": "newadmin@sendit.com" }
```

**Logic:** checks that no active admin or pending invite exists for this email. Creates `AdminInvite` record. Sends invite email *(when email service is connected)*.

**Returns:** `201 Created`
```json
{
  "id": 1,
  "email": "newadmin@sendit.com",
  "expiresAt": "2026-05-22T10:00:00Z"
}
```

**Errors:** `409` if email already registered or already has a pending invite.

---

### `PUT /admin/admins/:id`

**Purpose:** update an admin's status — deactivate or reactivate.

**Receives:**
```json
{ "status": "INACTIVE" }
```

**Returns:** `200 OK` — updated admin object.

---

### `DELETE /admin/admins/:id`

**Purpose:** permanently remove an admin account.

**Returns:** `204 No Content`

**Errors:** `403` if trying to delete own account or another `SUPER_ADMIN`.

---

*— End of document —*
