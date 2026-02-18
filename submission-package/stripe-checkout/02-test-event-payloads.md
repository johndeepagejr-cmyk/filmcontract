# Stripe Checkout — Test Event Payloads

## Verifying Webhook Integration

After configuring the webhook endpoint and signing secret, use these test scenarios to verify the integration is working correctly.

## Method 1: Stripe Dashboard Test Events

1. Go to **Developers → Webhooks → [Your endpoint]**
2. Click **"Send test webhook"**
3. Select an event type and click **"Send test webhook"**
4. Check your server logs for the event processing output

## Method 2: Stripe CLI (Recommended)

The Stripe CLI provides more realistic test events with full payloads.

### Test Scenario 1: Successful Payment (Escrow Funded)

```bash
stripe trigger payment_intent.succeeded
```

**Expected server behavior:**
- Log: `[Webhook] payment_intent.succeeded received`
- Escrow record updated to `funded` status
- Push notification sent to both producer and actor

### Test Scenario 2: Failed Payment

```bash
stripe trigger payment_intent.payment_failed
```

**Expected server behavior:**
- Log: `[Webhook] payment_intent.payment_failed received`
- Escrow record updated to `payment_failed` status
- Push notification sent to producer with failure reason

### Test Scenario 3: Connect Account Updated

```bash
stripe trigger account.updated
```

**Expected server behavior:**
- Log: `[Webhook] account.updated received`
- Actor's Stripe Connect status updated in database
- If onboarding complete: actor can now receive payouts

### Test Scenario 4: Charge Disputed

```bash
stripe trigger charge.dispute.created
```

**Expected server behavior:**
- Log: `[Webhook] charge.dispute.created received`
- Escrow record flagged as `disputed`
- Admin notification sent via Sentry alert

### Test Scenario 5: Transfer Created (Actor Payout)

```bash
stripe trigger transfer.created
```

**Expected server behavior:**
- Log: `[Webhook] transfer.created received`
- Escrow record updated to `paid_out` status
- Push notification sent to actor confirming payout

## Method 3: Real $1 Transaction Test

This is the most thorough verification and should be done before going live.

### Prerequisites
- Stripe account in **live mode** (not test mode)
- A real credit card
- The producer test account connected to Stripe

### Steps

1. Log in as `testproducer@filmcontract.app`
2. Create a new contract with `testactor@filmcontract.app` for **$1.00**
3. Process the payment through the escrow flow
4. Verify in Stripe Dashboard:
   - Payment of $1.00 appears in **Payments**
   - Platform fee of $0.08 (7.5% of $1.00, rounded) appears in **Connect → Collected fees**
   - Transfer to connected account appears in **Connect → Transfers**
5. Verify in the app:
   - Contract status updates to "Active" or "Funded"
   - Both accounts receive push notifications
6. Release the escrow to complete the flow
7. Verify the actor receives the payout minus the platform fee

### Expected Financial Breakdown for $1.00 Transaction

| Item | Amount |
|------|--------|
| Gross charge | $1.00 |
| Stripe processing fee (~2.9% + $0.30) | ~$0.33 |
| Platform fee (7.5%) | $0.08 |
| Net to actor | ~$0.59 |

Note: The exact Stripe processing fee depends on the card type and region.

## Verification Checklist

After running all test scenarios, confirm:

| Check | Status |
|-------|--------|
| Webhook endpoint returns `200` for valid events | ☐ |
| Webhook endpoint returns `400` for invalid signatures | ☐ |
| `payment_intent.succeeded` updates escrow status | ☐ |
| `payment_intent.payment_failed` triggers error handling | ☐ |
| `account.updated` syncs Connect onboarding status | ☐ |
| `charge.dispute.created` triggers admin alert | ☐ |
| `transfer.created` confirms actor payout | ☐ |
| Server logs show event processing for each type | ☐ |
| Push notifications fire for payment events | ☐ |
| Sentry captures any webhook processing errors | ☐ |
