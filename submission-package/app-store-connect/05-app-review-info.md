# App Store Connect — App Review Information

## Sign-in Required

**Yes** — The app requires sign-in to access core features.

## Test Account Credentials

Provide **both** accounts so the reviewer can test both sides of the marketplace.

### Account 1 — Actor Role

| Field | Value |
|-------|-------|
| Username | `testactor@filmcontract.app` |
| Password | `TestActor2026!` |
| Role | Actor |

### Account 2 — Producer Role

| Field | Value |
|-------|-------|
| Username | `testproducer@filmcontract.app` |
| Password | `TestProducer2026!` |
| Role | Producer |

## Review Notes (paste into "Notes" field)

```
FilmContract is a two-sided marketplace for independent film professionals.

TEST FLOW — ACTOR (testactor@filmcontract.app / TestActor2026!):
1. Sign in → Home screen shows open casting calls
2. Tap any casting call to view details
3. Tap "Submit Audition" to see the submission flow
4. Go to "My Submissions" to see tracked applications
5. Contracts tab shows active/pending contracts
6. Profile tab shows actor profile with bio and portfolio

TEST FLOW — PRODUCER (testproducer@filmcontract.app / TestProducer2026!):
1. Sign in → Dashboard shows stats and quick actions
2. Tap "Post Casting" to create a new casting call
3. View existing casting calls and review submissions
4. Contracts tab shows contract management
5. Network tab shows messaging and talent discovery

PAYMENTS:
The app uses Stripe Connect for escrow payments. In the test environment, no real charges are processed. The 7.5% platform fee is displayed on payment screens.

IMPORTANT NOTES:
- Both test accounts have pre-seeded data (casting calls, a contract, submissions)
- Messaging works between the two test accounts
- Push notifications require a physical device
- The app supports dark mode (follows system setting)
```

## Demo Video Link (optional)

If you record a demo video, upload it to an unlisted YouTube or Vimeo link and paste it here. This significantly reduces review time and rejection risk.

```
[Paste unlisted video URL here after recording]
```

## Contact Information

| Field | Value |
|-------|-------|
| First Name | [Your first name] |
| Last Name | [Your last name] |
| Phone | [Your phone number] |
| Email | [Your email] |

## Encryption (Export Compliance)

| Question | Answer |
|----------|--------|
| Does your app use encryption? | **Yes** |
| Does your app qualify for any exemptions? | **Yes** — The app uses HTTPS/TLS for network communication only, which qualifies for the exemption under Category 5, Part 2 of the EAR. |
| Do you need to provide documentation? | **No** — Select "Yes, it qualifies for an exemption" |

## Content Rights

| Question | Answer |
|----------|--------|
| Does your app contain, display, or access third-party content? | **Yes** — User-generated content (casting calls, audition tapes, messages) |
| Do you have the rights to this content? | **Yes** — Users grant us a license to display their content per our Terms of Service |

## IDFA (Advertising Identifier)

| Question | Answer |
|----------|--------|
| Does your app use the Advertising Identifier (IDFA)? | **No** |
