require('dotenv').config();
const key = process.env.STRIPE_WEBHOOK_SECRET || '';
console.log('STRIPE_WEBHOOK_SECRET set:', !!key);
if (key) {
  console.log('Prefix:', key.substring(0, 6) + '...');
  console.log('Length:', key.length);
}
