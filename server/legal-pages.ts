/**
 * Legal Pages — Privacy Policy & Terms of Service
 * Served as static HTML at /privacy and /terms
 * Required by App Store Connect and Google Play before public submission.
 */

const LAST_UPDATED = "February 18, 2026";
const APP_NAME = "FilmContract";
const COMPANY_NAME = "FilmContract";
const CONTACT_EMAIL = "privacy@filmcontract.app";
const SUPPORT_EMAIL = "support@filmcontract.app";
const WEBSITE = "https://filmcontract.app";

function pageShell(title: string, body: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} — ${APP_NAME}</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      line-height: 1.7;
      color: #1a1a2e;
      background: #fafafa;
      padding: 0;
    }
    header {
      background: linear-gradient(135deg, #0a7ea4, #065a75);
      color: #fff;
      padding: 48px 24px 40px;
      text-align: center;
    }
    header h1 { font-size: 28px; font-weight: 700; margin-bottom: 6px; }
    header p { font-size: 14px; opacity: 0.85; }
    main {
      max-width: 720px;
      margin: 0 auto;
      padding: 32px 24px 64px;
    }
    h2 {
      font-size: 20px;
      font-weight: 600;
      margin: 32px 0 12px;
      color: #0a7ea4;
    }
    h3 { font-size: 16px; font-weight: 600; margin: 20px 0 8px; }
    p, li { font-size: 15px; margin-bottom: 12px; }
    ul { padding-left: 24px; }
    li { margin-bottom: 6px; }
    a { color: #0a7ea4; text-decoration: none; }
    a:hover { text-decoration: underline; }
    table { width: 100%; border-collapse: collapse; margin: 16px 0; }
    th, td { text-align: left; padding: 10px 12px; border-bottom: 1px solid #e5e7eb; font-size: 14px; }
    th { background: #f0f4f8; font-weight: 600; }
    .footer {
      text-align: center;
      padding: 24px;
      font-size: 13px;
      color: #687076;
      border-top: 1px solid #e5e7eb;
      margin-top: 48px;
    }
    .footer a { color: #0a7ea4; }
    @media (prefers-color-scheme: dark) {
      body { background: #151718; color: #ecedee; }
      header { background: linear-gradient(135deg, #065a75, #043d50); }
      h2 { color: #2ec4e6; }
      th { background: #1e2022; }
      th, td { border-color: #334155; }
      .footer { border-color: #334155; color: #9ba1a6; }
    }
  </style>
</head>
<body>
  <header>
    <h1>${title}</h1>
    <p>Last updated: ${LAST_UPDATED}</p>
  </header>
  <main>
    ${body}
  </main>
  <div class="footer">
    <p>&copy; 2026 ${COMPANY_NAME}. All rights reserved.</p>
    <p><a href="/privacy">Privacy Policy</a> &middot; <a href="/terms">Terms of Service</a></p>
  </div>
</body>
</html>`;
}

// ─── PRIVACY POLICY ─────────────────────────────────────────────────────────

export const privacyPolicyHtml = pageShell("Privacy Policy", `
<p>${APP_NAME} ("we," "us," or "our") operates the ${APP_NAME} mobile application (the "App"). This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use the App.</p>

<h2>1. Information We Collect</h2>

<h3>1.1 Information You Provide</h3>
<table>
  <tr><th>Data Type</th><th>Purpose</th></tr>
  <tr><td>Name &amp; email address</td><td>Account creation and login</td></tr>
  <tr><td>Role (Producer / Actor)</td><td>Personalize your experience</td></tr>
  <tr><td>Profile information (bio, location, photos)</td><td>Build your professional profile</td></tr>
  <tr><td>Contract details (project titles, payment terms, dates)</td><td>Facilitate contract management</td></tr>
  <tr><td>Digital signatures</td><td>Contract execution</td></tr>
  <tr><td>Payment information</td><td>Process payments via Stripe</td></tr>
  <tr><td>Messages and comments</td><td>Communication between parties</td></tr>
  <tr><td>Self-tape videos and audition recordings</td><td>Casting and audition workflows</td></tr>
</table>

<h3>1.2 Information Collected Automatically</h3>
<ul>
  <li><strong>Device information:</strong> Device model, operating system version, unique device identifiers</li>
  <li><strong>Usage data:</strong> Features accessed, screens viewed, actions taken within the App</li>
  <li><strong>Log data:</strong> IP address, browser type, access times, and referring URLs</li>
  <li><strong>Push notification tokens:</strong> To deliver notifications you have opted into</li>
</ul>

<h2>2. How We Use Your Information</h2>
<p>We use the information we collect to:</p>
<ul>
  <li>Create and manage your account</li>
  <li>Facilitate contract creation, signing, and management between producers and actors</li>
  <li>Process payments and escrow transactions through Stripe</li>
  <li>Enable casting calls, submissions, and audition scheduling</li>
  <li>Provide reputation and review features for transparency</li>
  <li>Send push notifications about contract updates, payments, and messages</li>
  <li>Send email notifications about important account and contract events</li>
  <li>Improve and optimize the App's functionality and user experience</li>
  <li>Detect, prevent, and address technical issues and security threats</li>
  <li>Comply with legal obligations</li>
</ul>

<h2>3. Payment Processing</h2>
<p>All payment processing is handled by <strong>Stripe, Inc.</strong> We do not store your full credit card number, CVV, or bank account details on our servers. Stripe's privacy policy is available at <a href="https://stripe.com/privacy" target="_blank">stripe.com/privacy</a>.</p>
<p>A platform fee of 7.5% is applied to contract payments processed through the App. Escrow payments are held by Stripe until release conditions are met.</p>

<h2>4. Data Sharing and Disclosure</h2>
<p>We do not sell your personal information. We may share your information in the following circumstances:</p>
<ul>
  <li><strong>With other users:</strong> Your profile information, reviews, and reputation scores are visible to other App users as part of the platform's transparency features.</li>
  <li><strong>With Stripe:</strong> Payment data is shared with Stripe to process transactions.</li>
  <li><strong>With Sentry:</strong> Error and crash data is shared with Sentry for application monitoring and stability.</li>
  <li><strong>Legal requirements:</strong> When required by law, subpoena, or other legal process.</li>
  <li><strong>Business transfers:</strong> In connection with a merger, acquisition, or sale of assets.</li>
</ul>

<h2>5. Data Retention</h2>
<p>We retain your personal information for as long as your account is active or as needed to provide services. Contract data and payment records are retained for a minimum of 7 years to comply with financial record-keeping requirements. You may request deletion of your account by contacting us at <a href="mailto:${CONTACT_EMAIL}">${CONTACT_EMAIL}</a>.</p>

<h2>6. Data Security</h2>
<p>We implement industry-standard security measures including:</p>
<ul>
  <li>HTTPS encryption for all data in transit</li>
  <li>Bcrypt hashing for passwords</li>
  <li>Rate limiting on authentication and API endpoints</li>
  <li>Content Security Policy (CSP) and HTTP Strict Transport Security (HSTS) headers</li>
  <li>Secure session management with JWT tokens</li>
</ul>
<p>No method of transmission over the Internet is 100% secure. While we strive to protect your information, we cannot guarantee absolute security.</p>

<h2>7. Your Rights</h2>
<p>Depending on your jurisdiction, you may have the right to:</p>
<ul>
  <li>Access the personal data we hold about you</li>
  <li>Request correction of inaccurate data</li>
  <li>Request deletion of your data</li>
  <li>Object to or restrict processing of your data</li>
  <li>Data portability (receive your data in a structured format)</li>
  <li>Withdraw consent at any time</li>
</ul>
<p>To exercise any of these rights, contact us at <a href="mailto:${CONTACT_EMAIL}">${CONTACT_EMAIL}</a>.</p>

<h2>8. Children's Privacy</h2>
<p>The App is not intended for use by anyone under the age of 18. We do not knowingly collect personal information from children. If you believe a child has provided us with personal information, please contact us immediately.</p>

<h2>9. Third-Party Services</h2>
<table>
  <tr><th>Service</th><th>Purpose</th><th>Privacy Policy</th></tr>
  <tr><td>Stripe</td><td>Payment processing</td><td><a href="https://stripe.com/privacy" target="_blank">stripe.com/privacy</a></td></tr>
  <tr><td>Sentry</td><td>Error tracking</td><td><a href="https://sentry.io/privacy/" target="_blank">sentry.io/privacy</a></td></tr>
  <tr><td>Expo / EAS</td><td>App distribution &amp; push notifications</td><td><a href="https://expo.dev/privacy" target="_blank">expo.dev/privacy</a></td></tr>
</table>

<h2>10. Changes to This Policy</h2>
<p>We may update this Privacy Policy from time to time. We will notify you of any material changes by posting the new policy in the App and updating the "Last updated" date above. Your continued use of the App after changes constitutes acceptance of the updated policy.</p>

<h2>11. Contact Us</h2>
<p>If you have questions or concerns about this Privacy Policy, please contact us:</p>
<ul>
  <li><strong>Email:</strong> <a href="mailto:${CONTACT_EMAIL}">${CONTACT_EMAIL}</a></li>
  <li><strong>Support:</strong> <a href="mailto:${SUPPORT_EMAIL}">${SUPPORT_EMAIL}</a></li>
</ul>
`);

// ─── TERMS OF SERVICE ───────────────────────────────────────────────────────

export const termsOfServiceHtml = pageShell("Terms of Service", `
<p>Welcome to ${APP_NAME}. By downloading, installing, or using the ${APP_NAME} mobile application (the "App"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, do not use the App.</p>

<h2>1. Description of Service</h2>
<p>${APP_NAME} is a mobile platform that facilitates contract management, payment processing, casting, and professional networking between film industry producers and actors. The App provides tools for creating, signing, and managing contracts, processing payments through escrow, and discovering talent.</p>

<h2>2. Eligibility</h2>
<p>You must be at least 18 years old and legally capable of entering into binding contracts to use the App. By using the App, you represent and warrant that you meet these requirements.</p>

<h2>3. Account Registration</h2>
<ul>
  <li>You must provide accurate, current, and complete information during registration.</li>
  <li>You are responsible for maintaining the confidentiality of your account credentials.</li>
  <li>You are responsible for all activities that occur under your account.</li>
  <li>You must notify us immediately of any unauthorized use of your account.</li>
</ul>

<h2>4. Contracts and Legal Agreements</h2>
<p><strong>Important:</strong> ${APP_NAME} provides tools to facilitate contract creation and management. However:</p>
<ul>
  <li>Contracts created through the App are agreements between the parties involved (producers and actors).</li>
  <li>${APP_NAME} is not a party to any contract created through the App.</li>
  <li>${APP_NAME} does not provide legal advice. We recommend consulting with a qualified attorney before signing any contract.</li>
  <li>Digital signatures captured through the App are intended to indicate agreement. The legal enforceability of digital signatures may vary by jurisdiction.</li>
</ul>

<h2>5. Payments and Fees</h2>
<table>
  <tr><th>Fee Type</th><th>Amount</th><th>Description</th></tr>
  <tr><td>Platform fee</td><td>7.5%</td><td>Applied to contract payments processed through the App</td></tr>
  <tr><td>Stripe processing</td><td>~2.9% + $0.30</td><td>Standard Stripe fees (charged by Stripe)</td></tr>
  <tr><td>Subscription plans</td><td>Varies</td><td>Free, Pro, and Studio tiers with different feature limits</td></tr>
</table>
<ul>
  <li>All payments are processed through Stripe. By using payment features, you also agree to <a href="https://stripe.com/legal" target="_blank">Stripe's Terms of Service</a>.</li>
  <li>Escrow payments are held until the specified release conditions are met or a dispute is resolved.</li>
  <li>Refunds for disputed payments are handled on a case-by-case basis.</li>
</ul>

<h2>6. User Conduct</h2>
<p>You agree not to:</p>
<ul>
  <li>Use the App for any unlawful purpose or in violation of any applicable laws</li>
  <li>Impersonate any person or entity, or falsely represent your professional credentials</li>
  <li>Submit false reviews, ratings, or reputation information</li>
  <li>Harass, abuse, or harm other users</li>
  <li>Interfere with or disrupt the App's infrastructure or security</li>
  <li>Attempt to circumvent the platform's payment system to avoid fees</li>
  <li>Upload malicious content, viruses, or harmful code</li>
  <li>Scrape, mine, or collect user data without authorization</li>
</ul>

<h2>7. Intellectual Property</h2>
<ul>
  <li>The App, including its design, code, and branding, is the property of ${COMPANY_NAME}.</li>
  <li>Content you upload (profiles, self-tapes, photos) remains your intellectual property.</li>
  <li>By uploading content, you grant ${APP_NAME} a non-exclusive, worldwide license to display and distribute that content within the App for the purpose of providing the service.</li>
</ul>

<h2>8. Reputation and Reviews</h2>
<ul>
  <li>Reviews and ratings must be honest and based on genuine professional interactions.</li>
  <li>We reserve the right to remove reviews that violate these Terms or appear fraudulent.</li>
  <li>Reputation scores are calculated algorithmically and may not reflect all aspects of a professional relationship.</li>
</ul>

<h2>9. Limitation of Liability</h2>
<p>${APP_NAME} is provided "as is" and "as available." To the maximum extent permitted by law:</p>
<ul>
  <li>We disclaim all warranties, express or implied, including merchantability and fitness for a particular purpose.</li>
  <li>We are not liable for any indirect, incidental, special, consequential, or punitive damages.</li>
  <li>Our total liability shall not exceed the amount you paid to us in the 12 months preceding the claim.</li>
  <li>We are not responsible for disputes between producers and actors arising from contracts managed through the App.</li>
</ul>

<h2>10. Dispute Resolution</h2>
<p>Any disputes arising from these Terms or your use of the App shall be resolved through binding arbitration in accordance with the rules of the American Arbitration Association. You agree to waive any right to a jury trial or to participate in a class action.</p>

<h2>11. Termination</h2>
<p>We may suspend or terminate your account at any time for violation of these Terms. Upon termination:</p>
<ul>
  <li>Your right to use the App ceases immediately.</li>
  <li>Existing contracts and payment obligations remain in effect.</li>
  <li>We will retain data as required by law or as described in our Privacy Policy.</li>
</ul>

<h2>12. Changes to Terms</h2>
<p>We reserve the right to modify these Terms at any time. Material changes will be communicated through the App or via email. Continued use of the App after changes constitutes acceptance of the updated Terms.</p>

<h2>13. Governing Law</h2>
<p>These Terms are governed by the laws of the State of California, United States, without regard to conflict of law principles.</p>

<h2>14. Contact Us</h2>
<p>For questions about these Terms, please contact us:</p>
<ul>
  <li><strong>Email:</strong> <a href="mailto:${SUPPORT_EMAIL}">${SUPPORT_EMAIL}</a></li>
</ul>
`);
