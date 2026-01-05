# Payment Testing Guide - Paystack Integration

## Environment Status
✅ **Test Mode Active**
- Public Key: `pk_test_f35050b5eb3d669880bd70a77cbf5dc332e30898`
- Secret Key: `sk_test_f6fd4715453ca3061c7e1a5bfb629332fa71c652`
- Environment: `test`

## Test Card Details (Paystack Test Mode)

### Successful Payment
- **Card Number**: `4084084084084081`
- **Expiry**: `12/25` (any future date)
- **CVV**: `408`
- **OTP**: `123456`

### Failed Payment
- **Card Number**: `4111111111111111`
- **Expiry**: `12/25`
- **CVV**: `111`
- **OTP**: Any 6 digits

### Amount Restrictions
- Any amount works in test mode
- Amounts are in **Kobo** (₦1 = 100 Kobo in the API)
- Recommended test amounts: ₦5,000 - ₦50,000

## Testing Workflows

### 1. **Course Enrollment Payment** 
Steps:
1. Start onboarding process if new user
2. Select a course from catalog
3. Click "Enroll" or "Choose Plan"
4. Select payment plan (1-phase, 2-phase, etc.)
5. Click "Proceed to Payment"
6. You'll be redirected to `/payment-gateway` with state:
   ```
   {
     type: 'enrollment',
     course: { id, title, price },
     plan: 1,
     amount: calculated_amount,
     targetId: user_id
   }
   ```
7. Click payment button
8. Paystack modal opens
9. Enter test card details above
10. Enter OTP: `123456`
11. Payment verifies via `/api/paystack/verify`
12. Success → enrolled in course + onboarding completed
13. Redirected to dashboard

### 2. **Credit Top-Up Payment**
Steps:
1. Go to **Financial Node** (Payments page)
2. Click **"Sync Credit"** button
3. Modal opens - enter amount (e.g., ₦10,000)
4. Click "Proceed to Payment"
5. Redirected to `/payment-gateway` with state:
   ```
   {
     type: 'recharge',
     amount: 10000,
     targetId: user_id,
     role: 'student'
   }
   ```
6. Complete payment same as above
7. Transaction recorded in "Transaction Audit"
8. Balance updated in "Platform Inflow Ledger"

## API Verification Flow

**Endpoint**: `POST /api/paystack/verify`

**Request Body**:
```json
{
  "reference": "IGX_SYNC_1234567890",
  "userId": "user-uuid",
  "courseId": "course-uuid",
  "plan": 1
}
```

**Response** (Success):
```json
{
  "verified": true,
  "data": {
    "status": "success",
    "amount": 5000,
    "reference": "IGX_SYNC_1234567890",
    "customer": { "id": "..." }
  }
}
```

**Database Updates on Success**:
1. ✅ Insert into `transactions` table
2. ✅ Update `enrollments` table (if courseId provided)
3. ✅ Set `payment_verified: true`

## Testing Checklist

- [ ] Dev server running (`npm run dev`)
- [ ] Can navigate to `/payment-gateway`
- [ ] Paystack modal opens with correct amount
- [ ] Test card payment succeeds
- [ ] `/api/paystack/verify` returns `verified: true`
- [ ] Transaction appears in Payments page
- [ ] Course shows as enrolled
- [ ] Onboarding completes after first payment
- [ ] Balance updates in Financial Node

## Common Issues & Fixes

### Issue: "Paystack not defined"
- Check if Paystack script is loaded in `index.html`
- Verify `VITE_PAYSTACK_PUBLIC_KEY` in `.env.local`

### Issue: "Reference missing" error
- Payment button may not be rendering state correctly
- Check browser console for state object

### Issue: Transaction not appearing
- Check Supabase `transactions` table has correct user_id
- Verify `/api/paystack/verify` endpoint is accessible
- Check backend logs for any DB errors

### Issue: Onboarding doesn't complete
- Verify `finalizeOnboarding()` is being called
- Check user's `has_onboarded` status in profiles table
- Check localStorage for `innogx_user_session`

## Manual Testing via cURL

```bash
# Test verification endpoint (replace reference value)
curl -X POST http://localhost:5173/api/paystack/verify \
  -H "Content-Type: application/json" \
  -d '{
    "reference": "IGX_SYNC_1234567890",
    "userId": "your-user-id",
    "courseId": "your-course-id",
    "plan": 1
  }'
```

## Production Checklist

Before going live:
- [ ] Switch to live Paystack keys
- [ ] Update `VITE_PAYSTACK_PUBLIC_KEY` (pk_live_...)
- [ ] Update `PAYSTACK_SECRET_KEY` (sk_live_...)
- [ ] Set `VITE_PAYSTACK_ENV=live`
- [ ] Test with real amounts
- [ ] Enable 3D Secure if required
- [ ] Update payment plan terms/pricing
- [ ] Test webhook handling for payment confirmations

## Paystack Dashboard

Access test transactions and monitoring at: https://dashboard.paystack.com
- View all test transactions
- Monitor refunds
- Check customer data
- View webhook logs
