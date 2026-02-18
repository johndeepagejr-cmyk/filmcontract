# Stripe Checkout — Platform Fee Explanation

## Overview

FilmContract charges a **7.5% platform fee** on all escrow transactions processed through Stripe Connect. This document explains the fee structure for internal reference, Stripe support inquiries, and user-facing transparency.

## Fee Structure

| Component | Rate | Paid By | Description |
|-----------|------|---------|-------------|
| Platform fee | 7.5% of gross amount | Deducted from transaction | FilmContract's revenue for facilitating the deal |
| Stripe processing fee | ~2.9% + $0.30 | Deducted from transaction | Stripe's standard card processing fee |

## How It Works

When a producer pays an actor through FilmContract's escrow system, the payment flows as follows:

1. **Producer pays $1,000** via credit card
2. **Stripe processes the charge** and deducts its processing fee (~$29.30)
3. **FilmContract collects the platform fee** ($75.00, which is 7.5% of $1,000)
4. **Actor receives the remainder** (~$895.70)

### Detailed Breakdown Example ($1,000 Transaction)

| Line Item | Amount |
|-----------|--------|
| Gross charge to producer | $1,000.00 |
| Stripe processing fee (2.9% + $0.30) | -$29.30 |
| Platform fee (7.5% of $1,000) | -$75.00 |
| **Net payout to actor** | **$895.70** |

## Implementation in Code

The platform fee is calculated using the constant `PLATFORM_FEE_RATE = 0.075` defined in the Stripe Connect router. The fee is applied as an `application_fee_amount` on Stripe's destination charge, which means Stripe automatically splits the payment between the platform (FilmContract) and the connected account (actor).

```typescript
// From stripe-connect-router.ts
const PLATFORM_FEE_RATE = 0.075;
const applicationFeeAmount = Math.round(grossAmount * PLATFORM_FEE_RATE * 100); // in cents
```

The fee is calculated consistently across all four code paths:
1. **Create Payment Intent** — Initial escrow funding
2. **Process Escrow Payment** — Direct escrow transactions
3. **Release Escrow** — When funds are released to the actor
4. **Earnings Calculation** — Dashboard display of net earnings

## Why 7.5%?

The 7.5% rate was chosen based on competitive analysis of similar marketplace platforms:

| Platform | Fee Rate | Category |
|----------|----------|----------|
| Fiverr | 20% (seller) + 5.5% (buyer) | Freelance marketplace |
| Upwork | 10% (under $10K) | Freelance marketplace |
| Backstage | $19.99/mo subscription | Casting platform |
| Casting Networks | $39.95/mo subscription | Casting platform |
| **FilmContract** | **7.5% per transaction** | **Film contracts + casting** |

FilmContract's transaction-based model means users pay nothing until money actually moves, which is more accessible than subscription-based competitors for independent filmmakers.

## If Stripe Support Questions the Fee

Stripe may ask about the platform fee during account review. Here is the recommended response:

> FilmContract is a marketplace platform connecting film producers with actors. The 7.5% application fee covers platform services including secure escrow management, digital contract creation and signing, casting call distribution, audition submission processing, and in-app messaging. The fee is transparently disclosed to all users before any transaction and is documented in our Terms of Service at filmcontract.app/terms.

## User-Facing Disclosure

The platform fee is disclosed in the following locations:

1. **Terms of Service** (`/terms`) — Section on Fees and Payments
2. **Payment confirmation screen** — Shows fee breakdown before the producer confirms
3. **Escrow detail view** — Shows platform fee, Stripe fee, and net amount
4. **Actor earnings dashboard** — Shows gross, fees, and net for each transaction

## Tax Implications

FilmContract should issue **1099-K** forms to actors who receive more than $600 in a calendar year (per IRS requirements for third-party settlement organizations). Stripe Connect handles this automatically if you enable the **Tax Reporting** feature in your Stripe Dashboard under **Connect → Tax forms**.
