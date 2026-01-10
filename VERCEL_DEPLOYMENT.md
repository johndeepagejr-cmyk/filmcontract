# Vercel Deployment Guide for FilmContract

This guide provides step-by-step instructions for deploying the FilmContract web application to Vercel for a permanent, shareable domain.

## Prerequisites

- GitHub account with the FilmContract repository
- Vercel account (free tier available at https://vercel.com)
- Environment variables ready (database URL, Stripe keys, etc.)

## Step 1: Prepare Your Repository

1. Ensure your code is pushed to GitHub
2. Verify that `vercel.json` and `.vercelignore` are in the project root
3. Confirm all environment variables are documented

## Step 2: Connect to Vercel

1. Go to https://vercel.com and sign in with your GitHub account
2. Click "Add New..." → "Project"
3. Select your GitHub repository containing FilmContract
4. Vercel will auto-detect the project as an Expo/React Native app

## Step 3: Configure Environment Variables

In the Vercel dashboard:

1. Go to your project settings
2. Navigate to "Environment Variables"
3. Add the following variables:

| Variable | Value | Notes |
|----------|-------|-------|
| `DATABASE_URL` | Your MySQL connection string | Format: `mysql://user:password@host:port/database` |
| `STRIPE_PUBLISHABLE_KEY` | Your Stripe public key | Starts with `pk_live_` or `pk_test_` |
| `STRIPE_SECRET_KEY` | Your Stripe secret key | Starts with `sk_live_` or `sk_test_` |
| `NODE_ENV` | `production` | Ensures optimized builds |

## Step 4: Deploy

1. Click "Deploy" button in Vercel dashboard
2. Wait for the build to complete (usually 2-5 minutes)
3. Once deployed, you'll receive a unique Vercel URL like: `https://filmcontract.vercel.app`

## Step 5: Configure Custom Domain (Optional)

To use a custom domain (e.g., filmcontract.com):

1. In Vercel dashboard, go to "Settings" → "Domains"
2. Click "Add Domain"
3. Enter your domain name
4. Follow DNS configuration instructions from your domain registrar
5. Vercel will provide CNAME records to add

## Step 6: Set Up Continuous Deployment

Vercel automatically deploys when you push to your main branch:

1. Any push to `main` triggers a production deployment
2. Pull requests create preview deployments
3. Deployments are automatic and require no manual intervention

## Environment Variables for Production

### Database Configuration

```
DATABASE_URL=mysql://username:password@your-host.com:3306/filmcontract_prod
```

### Stripe Configuration

For live payments, use production keys:

```
STRIPE_PUBLISHABLE_KEY=pk_live_your_publishable_key
STRIPE_SECRET_KEY=sk_live_your_secret_key
```

For testing, use test keys:

```
STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key
STRIPE_SECRET_KEY=sk_test_your_secret_key
```

## Monitoring and Logs

1. Go to "Deployments" tab to see deployment history
2. Click any deployment to view build logs
3. Use "Functions" tab to monitor API performance
4. Check "Analytics" for traffic and performance metrics

## Troubleshooting

### Build Fails

- Check build logs in Vercel dashboard
- Verify all environment variables are set
- Ensure `package.json` has correct scripts
- Check that `vercel.json` is properly configured

### Database Connection Issues

- Verify `DATABASE_URL` is correct
- Ensure database allows connections from Vercel IPs
- Check database credentials and permissions
- Test connection locally first

### Stripe Integration Not Working

- Verify API keys are correct and not expired
- Ensure webhook endpoints are configured in Stripe dashboard
- Check that environment variables are set in Vercel
- Test with Stripe test keys first

## Rollback to Previous Deployment

1. Go to "Deployments" tab
2. Find the previous working deployment
3. Click the three dots menu
4. Select "Promote to Production"

## Performance Optimization

1. Enable "Automatic Git Integration" for faster deployments
2. Use "Preview Deployments" for testing before production
3. Monitor "Analytics" to identify performance bottlenecks
4. Use Vercel's built-in caching for static assets

## Security Best Practices

1. Never commit secrets to GitHub - use Vercel environment variables
2. Enable "Protected Branches" in GitHub to require reviews
3. Use separate Stripe test and production keys
4. Regularly rotate database passwords
5. Monitor Vercel logs for suspicious activity

## Support and Resources

- Vercel Documentation: https://vercel.com/docs
- Vercel Community: https://vercel.com/community
- Stripe Documentation: https://stripe.com/docs
- FilmContract Support: Contact development team

## Permanent URL

Once deployed, your app will be accessible at:

```
https://filmcontract.vercel.app
```

Or with a custom domain:

```
https://your-domain.com
```

Share this URL with anyone to access the FilmContract application!
