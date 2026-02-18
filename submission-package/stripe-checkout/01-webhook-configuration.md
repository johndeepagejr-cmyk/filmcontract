# Stripe Checkout — Webhook Configuration

## Overview

FilmContract uses Stripe Connect with destination charges for escrow payments. Webhooks notify the server when payment events occur, enabling real-time status updates for contracts and escrow transactions.

## Webhook Endpoint Setup

### Step-by-Step Instructions

1. Log in to [Stripe Dashboard](https://dashboard.stripe.com)
2. Navigate to **Developers** → **Webhooks**
3. Click **"Add endpoint"**
4. Configure as follows:

| Field | Value |
|-------|-------|
| Endpoint URL | `https://YOUR_PRODUCTION_DOMAIN/api/webhooks/stripe` |
| Description | FilmContract production webhook |
| Listen to | Events on your account |
| Version | Latest API version |

5. Select the events listed below
6. Click **"Add endpoint"**
7. Copy the **Signing secret** (starts with `whsec_`)
8. Paste it into FilmContract's **Settings → Secrets** panel as `STRIPE_WEBHOOK_SECRET`

## Required Webhook Events

Select these events when creating the endpoint:

### Payment Events

| Event | Purpose |
|-------|---------|
| `payment_intent.succeeded` | Mark escrow as funded, notify both parties |
| `payment_intent.payment_failed` | Alert producer of failed payment, update escrow status |
| `payment_intent.canceled` | Handle cancelled payment intents |
| `payment_intent.requires_action` | Notify producer that 3D Secure or additional action is needed |

### Transfer Events

| Event | Purpose |
|-------|---------|
| `transfer.created` | Confirm actor payout was initiated |
| `transfer.reversed` | Handle reversed transfers (disputes) |

### Connect Account Events

| Event | Purpose |
|-------|---------|
| `account.updated` | Track Stripe Connect onboarding status for actors |
| `account.application.deauthorized` | Handle disconnected Stripe accounts |

### Charge Events

| Event | Purpose |
|-------|---------|
| `charge.succeeded` | Backup confirmation for successful charges |
| `charge.refunded` | Handle refunds and update escrow status |
| `charge.dispute.created` | Alert admin of payment disputes |
| `charge.dispute.closed` | Update dispute resolution status |

### Payout Events (optional but recommended)

| Event | Purpose |
|-------|---------|
| `payout.paid` | Confirm funds reached actor's bank account |
| `payout.failed` | Alert actor of failed bank payout |

## Webhook Security

The server verifies every webhook using the signing secret. The verification flow:

1. Stripe sends a `POST` request with a `Stripe-Signature` header
2. The server reconstructs the expected signature using the `STRIPE_WEBHOOK_SECRET`
3. If the signature matches, the event is processed; otherwise, it returns `400`

This prevents replay attacks and ensures only legitimate Stripe events are processed.

## Testing Webhooks Locally

During development, use the Stripe CLI to forward events to your local server:

```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login
stripe login

# Forward events to local server
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# In another terminal, trigger test events
stripe trigger payment_intent.succeeded
stripe trigger account.updated
```

## Production Monitoring

After setting up the webhook in production:

1. Go to **Developers → Webhooks → [Your endpoint]**
2. Check the **"Attempts"** tab to see delivery status
3. Failed deliveries are retried automatically for up to 3 days
4. Set up email alerts: **Developers → Webhooks → [Your endpoint] → Settings → Email notifications**
