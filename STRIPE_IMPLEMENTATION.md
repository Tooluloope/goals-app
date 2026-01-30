# Stripe Subscription Implementation - Complete Guide

## 📋 Implementation Status

✅ **BACKEND COMPLETE** - All code implemented and ready
⏳ **PENDING** - Database migration needs to be run
⏳ **PENDING** - Frontend implementation

---

## 🎯 What Was Implemented

### 1. Database Schema

**File:** `packages/database/prisma/schema.prisma`

Added two new models:

- **Subscription**: Tracks user subscriptions, Stripe customer IDs, plan type, status, and billing periods
- **UsageQuota**: Tracks usage counters for goals, habits, and workspaces

New enums:

- `SubscriptionPlan`: FREE, PRO, FAMILY
- `SubscriptionStatus`: ACTIVE, TRIALING, PAST_DUE, CANCELED, INCOMPLETE, INCOMPLETE_EXPIRED, UNPAID

### 2. Environment Configuration

**Files:** `.env.example`, `.env.prod.example`

Added Stripe configuration variables:

```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRO_PRICE_ID=price_...
STRIPE_FAMILY_PRICE_ID=price_...
TRIAL_PERIOD_DAYS=14
```

### 3. Stripe Module

**Location:** `apps/api/src/modules/stripe/`

**Files Created:**

- `stripe.service.ts` - Core Stripe integration
- `stripe.controller.ts` - API endpoints
- `stripe.module.ts` - Module configuration

**Key Features:**

- Create/retrieve Stripe customers
- Create checkout sessions for subscriptions
- Create billing portal sessions
- Handle subscription webhooks
- Cancel subscriptions

**Endpoints:**

- `POST /api/stripe/create-checkout-session` - Initiate subscription purchase
- `POST /api/stripe/create-portal-session` - Open billing management
- `POST /api/stripe/cancel-subscription` - Cancel subscription
- `POST /api/stripe/webhook` - Handle Stripe events (unauthenticated)

### 4. Subscriptions Module

**Location:** `apps/api/src/modules/subscriptions/`

**Files Created:**

- `subscriptions.service.ts` - Business logic for plan management
- `subscriptions.controller.ts` - Subscription status endpoints
- `subscriptions.module.ts` - Module configuration

**Key Features:**

- Get/create user subscriptions
- Check plan requirements
- Enforce feature access based on plan
- Initialize subscriptions for new users

**Endpoints:**

- `GET /api/subscriptions/status` - Get current subscription info
- `GET /api/subscriptions/limits` - Get plan limits

**Plan Hierarchy:**

- FREE: 3 goals, 5 habits, 1 workspace
- PRO: Unlimited goals/habits, AI features, 1 workspace
- FAMILY: Everything in PRO + unlimited workspaces (family)

### 5. Usage Module

**Location:** `apps/api/src/modules/usage/`

**Files Created:**

- `usage.service.ts` - Usage tracking and quota enforcement
- `usage.controller.ts` - Usage stats endpoints
- `usage.module.ts` - Module configuration

**Key Features:**

- Track usage of goals, habits, workspaces
- Enforce quota limits for FREE tier
- Auto-increment/decrement counters
- Sync usage from actual database counts

**Endpoints:**

- `GET /api/usage` - Get current usage stats
- `POST /api/usage/sync` - Sync usage from database

### 6. Guards & Decorators

**Location:** `apps/api/src/common/`

**Files Created:**

- `guards/subscription.guard.ts` - Plan requirement enforcement
- `guards/quota.guard.ts` - Quota enforcement
- `decorators/requires-plan.decorator.ts` - `@RequiresPlan('PRO')` decorator
- `decorators/check-quota.decorator.ts` - `@CheckQuota('goals')` decorator

### 7. Feature Gates Applied

**AI Endpoints** (Require PRO plan):

- `apps/api/src/modules/ai/ai.controller.ts` - All AI features gated with `@RequiresPlan('PRO')`
- AI chat, summaries, insights, daily text

**Family Workspaces** (Require FAMILY plan):

- `apps/api/src/modules/workspaces/workspaces.service.ts` - Family workspace creation enforced

**Quota Enforcement** (FREE tier limits):

- `apps/api/src/modules/projects/projects.service.ts` - 3 goals limit
- `apps/api/src/modules/habits/habits.service.ts` - 5 habits limit

### 8. Auth Integration

**File:** `apps/api/src/modules/auth/auth.service.ts`

Updated signup process to:

- Create Stripe customer on signup
- Initialize FREE subscription
- Create usage quota record

### 9. Shared Schemas

**File:** `packages/shared/src/validation/schemas.ts`

Added validation schemas for:

- `createCheckoutSessionSchema`
- `createPortalSessionSchema`
- `updateSubscriptionSchema`
- `cancelSubscriptionSchema`
- `subscriptionPlanEnum`
- `subscriptionStatusEnum`

### 10. Module Integration

**File:** `apps/api/src/app.module.ts`

Registered new modules:

- StripeModule
- SubscriptionsModule
- UsageModule

Updated module dependencies:

- AuthModule → imports StripeModule, SubscriptionsModule
- AiModule → imports SubscriptionsModule
- WorkspacesModule → imports SubscriptionsModule, UsageModule
- ProjectsModule → imports UsageModule
- HabitsModule → imports UsageModule

---

## 🚀 Next Steps

### Step 1: Run Database Migration

**Option A: Using pnpm (recommended)**

```bash
cd packages/database
pnpm exec prisma migrate dev --name add_subscriptions_and_usage_quotas
```

**Option B: Using npx directly**

```bash
cd packages/database
npx prisma migrate dev --name add_subscriptions_and_usage_quotas
```

**Option C: Using turbo**

```bash
turbo run db:migrate --filter=@goals/database
# When prompted for migration name, enter: add_subscriptions_and_usage_quotas
```

**Note:** You need Node.js 18+ for Prisma to work. If you get `??=` syntax errors, upgrade Node.

### Step 2: Generate Prisma Client

```bash
cd packages/database
pnpm exec prisma generate
```

### Step 3: Configure Stripe

1. **Create Stripe Account**
   - Go to [stripe.com](https://stripe.com)
   - Sign up for an account

2. **Create Products in Stripe Dashboard**
   Navigate to Products → Add Product:

   **Product 1: Pro Plan**
   - Name: "Pro Plan"
   - Price: $7.00 USD
   - Billing period: Monthly (recurring)
   - Copy the Price ID (starts with `price_`)

   **Product 2: Family Plan**
   - Name: "Family Plan"
   - Price: $14.00 USD
   - Billing period: Monthly (recurring)
   - Copy the Price ID (starts with `price_`)

3. **Get API Keys**
   - Go to Developers → API keys
   - Copy "Publishable key" (starts with `pk_test_`)
   - Copy "Secret key" (starts with `sk_test_`)

4. **Set Up Webhook**
   - Go to Developers → Webhooks
   - Add endpoint: `https://your-domain.com/api/stripe/webhook`
   - Select events to listen to:
     - `customer.subscription.created`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `invoice.payment_succeeded`
     - `invoice.payment_failed`
     - `checkout.session.completed`
   - Copy the webhook signing secret (starts with `whsec_`)

5. **Update .env File**

```env
# Add to your .env file
STRIPE_SECRET_KEY=sk_test_YOUR_SECRET_KEY
STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_PUBLISHABLE_KEY
STRIPE_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET
STRIPE_PRO_PRICE_ID=price_YOUR_PRO_PRICE_ID
STRIPE_FAMILY_PRICE_ID=price_YOUR_FAMILY_PRICE_ID
TRIAL_PERIOD_DAYS=14
```

### Step 4: Test Backend

1. **Start your API server**

```bash
cd apps/api
pnpm dev
```

2. **Test endpoints with curl or Postman**

**Create a checkout session:**

```bash
curl -X POST http://localhost:3001/api/stripe/create-checkout-session \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"plan": "PRO"}'
```

**Get subscription status:**

```bash
curl http://localhost:3001/api/subscriptions/status \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Get usage stats:**

```bash
curl http://localhost:3001/api/usage \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

3. **Test Stripe webhooks locally**

```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Forward webhooks to local server
stripe listen --forward-to localhost:3001/api/stripe/webhook

# Use the webhook signing secret from CLI output in your .env
```

---

## 📱 Frontend Implementation (TODO)

### 1. Subscription Store

**File to create:** `apps/web/src/store/subscription-store.ts`

```typescript
import { create } from 'zustand';

interface SubscriptionState {
  plan: 'FREE' | 'PRO' | 'FAMILY';
  status: string;
  trialEndsAt: Date | null;
  currentPeriodEnd: Date | null;
  features: {
    unlimitedGoals: boolean;
    unlimitedHabits: boolean;
    aiFeatures: boolean;
    familyWorkspaces: boolean;
    advancedAnalytics: boolean;
  };
  usage: {
    goalsCount: number;
    habitsCount: number;
    workspacesCount: number;
    limits: {
      goals: number;
      habits: number;
      workspaces: number;
    };
  };
  fetchSubscription: () => Promise<void>;
  fetchUsage: () => Promise<void>;
}

export const useSubscriptionStore = create<SubscriptionState>((set) => ({
  // ... implementation
}));
```

### 2. Upgrade Components

**Component 1: Upgrade Button**
**File:** `apps/web/src/components/subscription/upgrade-button.tsx`

- Displays "Upgrade to Pro" or "Upgrade to Family"
- Calls `/api/stripe/create-checkout-session`
- Redirects to Stripe Checkout

**Component 2: Upgrade Modal**
**File:** `apps/web/src/components/subscription/upgrade-modal.tsx`

- Shows plan comparison
- Displays features included in each tier
- Upgrade buttons for each plan

**Component 3: Plan Badge**
**File:** `apps/web/src/components/subscription/plan-badge.tsx`

- Displays current plan (FREE/PRO/FAMILY)
- Shows trial status if applicable
- Links to billing settings

**Component 4: Usage Meter**
**File:** `apps/web/src/components/subscription/usage-meter.tsx`

- Shows quota usage for FREE tier
- Progress bar: "3/3 goals used"
- "Upgrade" CTA when limit reached

**Component 5: Quota Warning Banner**
**File:** `apps/web/src/components/subscription/quota-warning.tsx`

- Appears when approaching limits
- "You've used 2/3 of your goals. Upgrade to Pro for unlimited goals"

### 3. Billing Settings Page

**File:** `apps/web/src/app/settings/billing/page.tsx`

```typescript
export default function BillingPage() {
  const { subscription, usage } = useSubscriptionStore();

  return (
    <div>
      {/* Current Plan Section */}
      <div>
        <h2>Current Plan: {subscription.plan}</h2>
        <p>Status: {subscription.status}</p>
        {subscription.trialEndsAt && (
          <p>Trial ends: {subscription.trialEndsAt}</p>
        )}
      </div>

      {/* Usage Section (FREE tier only) */}
      {subscription.plan === 'FREE' && (
        <div>
          <h3>Usage</h3>
          <UsageMeter
            resource="goals"
            current={usage.goalsCount}
            limit={usage.limits.goals}
          />
          <UsageMeter
            resource="habits"
            current={usage.habitsCount}
            limit={usage.limits.habits}
          />
        </div>
      )}

      {/* Upgrade Button */}
      {subscription.plan !== 'FAMILY' && (
        <UpgradeButton />
      )}

      {/* Manage Billing Button (PRO/FAMILY only) */}
      {subscription.plan !== 'FREE' && (
        <BillingPortalButton />
      )}
    </div>
  );
}
```

### 4. Success/Cancel Pages

**Success Page:** `apps/web/src/app/billing/success/page.tsx`

```typescript
export default function BillingSuccessPage() {
  // Fetch session_id from URL query params
  // Show success message
  // Redirect to dashboard after 3 seconds
}
```

**Cancel Page:** `apps/web/src/app/billing/cancel/page.tsx`

```typescript
export default function BillingCancelPage() {
  // Show cancellation message
  // Link back to pricing or settings
}
```

### 5. Update Signup Flow

**File:** `apps/web/src/app/auth/signup/page.tsx`

```typescript
// Detect plan from URL: ?plan=pro or ?plan=family
const searchParams = useSearchParams();
const plan = searchParams.get('plan');

// After successful signup:
if (plan === 'pro' || plan === 'family') {
  // Redirect to Stripe Checkout
  const response = await fetch('/api/stripe/create-checkout-session', {
    method: 'POST',
    body: JSON.stringify({ plan: plan.toUpperCase() }),
  });
  const { url } = await response.json();
  window.location.href = url;
} else {
  // Free plan - redirect to dashboard
  router.push('/dashboard');
}
```

### 6. Update Marketing Page

**File:** `apps/marketing/src/components/pricing.tsx`

Update the CTA buttons:

```typescript
// Free Plan
<Link href={`${process.env.NEXT_PUBLIC_APP_URL}/auth/signup`}>
  Get Started
</Link>

// Pro Plan
<Link href={`${process.env.NEXT_PUBLIC_APP_URL}/auth/signup?plan=pro`}>
  Start Pro Trial
</Link>

// Family Plan
<Link href={`${process.env.NEXT_PUBLIC_APP_URL}/auth/signup?plan=family`}>
  Start Family Trial
</Link>
```

### 7. Add Upgrade Prompts Throughout App

**When hitting FREE tier limits:**

```typescript
// In goals creation page
const { canCreate } = useSubscriptionStore();

if (!canCreate('goals')) {
  return (
    <QuotaWarning
      message="You've reached your goal limit (3/3)"
      upgradeText="Upgrade to Pro for unlimited goals"
    />
  );
}
```

**When accessing AI features:**

```typescript
// In AI chat page
const { features } = useSubscriptionStore();

if (!features.aiFeatures) {
  return (
    <UpgradeModal
      feature="AI Chat"
      requiredPlan="PRO"
    />
  );
}
```

---

## 🧪 Testing Checklist

### Backend Tests

- [ ] User signup creates FREE subscription
- [ ] User signup creates Stripe customer
- [ ] Usage quota initialized correctly
- [ ] FREE tier can create 3 goals
- [ ] FREE tier blocked at 4th goal
- [ ] FREE tier can create 5 habits
- [ ] FREE tier blocked at 6th habit
- [ ] AI endpoints return 403 for FREE tier
- [ ] AI endpoints work for PRO tier
- [ ] Family workspace creation blocked for FREE/PRO
- [ ] Family workspace creation works for FAMILY
- [ ] Checkout session creation works
- [ ] Webhook updates subscription correctly
- [ ] Billing portal session creation works
- [ ] Subscription cancellation works
- [ ] Trial period tracking works

### Frontend Tests (Once Implemented)

- [ ] Signup with `?plan=pro` redirects to checkout
- [ ] Signup with `?plan=family` redirects to checkout
- [ ] Checkout success page shows confirmation
- [ ] Subscription status displays correctly
- [ ] Usage meters show correct counts
- [ ] Upgrade button redirects to Stripe
- [ ] Billing portal button works
- [ ] Quota warnings appear at limits
- [ ] AI feature prompts appear for FREE users
- [ ] Plan badge shows correct tier

### Stripe Test Cards

Use these test cards in Stripe test mode:

- **Successful payment:** `4242 4242 4242 4242`
- **Payment declined:** `4000 0000 0000 0002`
- **3D Secure required:** `4000 0025 0000 3155`
- **Insufficient funds:** `4000 0000 0000 9995`

Expiry: Any future date
CVC: Any 3 digits
ZIP: Any 5 digits

---

## 🔧 Troubleshooting

### Issue: Migration fails with Prisma errors

**Solution:** Make sure you're using Node.js 18+

```bash
node --version  # Should show v18.x or higher
```

### Issue: Stripe webhook signature verification fails

**Solution:**

1. Check that `STRIPE_WEBHOOK_SECRET` matches the webhook secret in Stripe dashboard
2. For local testing, use Stripe CLI: `stripe listen --forward-to localhost:3001/api/stripe/webhook`

### Issue: Feature gates not working

**Solution:** Check that:

1. Subscription guard is registered in the module
2. `@RequiresPlan` decorator is applied to controller/method
3. User has valid subscription record in database

### Issue: Usage quotas not updating

**Solution:**

1. Run `/api/usage/sync` to sync from database
2. Check that increment/decrement calls are in the service methods
3. Verify UsageQuota record exists for user

---

## 📊 API Endpoints Summary

### Stripe Endpoints

| Method | Endpoint                              | Auth | Description                  |
| ------ | ------------------------------------- | ---- | ---------------------------- |
| POST   | `/api/stripe/create-checkout-session` | ✅   | Create subscription checkout |
| POST   | `/api/stripe/create-portal-session`   | ✅   | Open billing portal          |
| POST   | `/api/stripe/cancel-subscription`     | ✅   | Cancel subscription          |
| POST   | `/api/stripe/webhook`                 | ❌   | Handle Stripe webhooks       |

### Subscription Endpoints

| Method | Endpoint                    | Auth | Description           |
| ------ | --------------------------- | ---- | --------------------- |
| GET    | `/api/subscriptions/status` | ✅   | Get subscription info |
| GET    | `/api/subscriptions/limits` | ✅   | Get plan limits       |

### Usage Endpoints

| Method | Endpoint          | Auth | Description        |
| ------ | ----------------- | ---- | ------------------ |
| GET    | `/api/usage`      | ✅   | Get usage stats    |
| POST   | `/api/usage/sync` | ✅   | Sync usage from DB |

---

## 💰 Pricing Structure

### FREE Plan

- **Price:** $0/month
- **Limits:**
  - 3 goals
  - 5 habits
  - 1 personal workspace
- **Features:**
  - Daily journal
  - Basic dashboard
  - Email reminders

### PRO Plan

- **Price:** $7/month
- **Trial:** 14 days
- **Limits:**
  - Unlimited goals
  - Unlimited habits
  - 1 personal workspace
- **Features:**
  - Everything in FREE
  - AI chat & insights
  - AI summaries
  - Weekly & monthly reviews
  - Advanced analytics
  - Data export
  - Priority support

### FAMILY Plan

- **Price:** $14/month
- **Trial:** 14 days
- **Limits:**
  - Unlimited goals
  - Unlimited habits
  - Unlimited workspaces
- **Features:**
  - Everything in PRO
  - Up to 6 family members
  - Shared workspaces
  - Family progress dashboard
  - Collaborative goals

---

## 🎉 Implementation Complete!

The backend is fully implemented and ready to go. All you need to do is:

1. ✅ Run the database migration
2. ✅ Configure Stripe in the dashboard
3. ✅ Update your .env file
4. ✅ Test the backend endpoints
5. 🔲 Implement the frontend components

Good luck with the frontend implementation! 🚀
