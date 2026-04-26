# Task: Push Notification Workout Reminders

## Goal
Implement web push notification reminders for users to prompt them about scheduled workouts. Users should be able to opt in via the coach page after onboarding is complete.

## Context
- Coach page: `src/app/coach/page.tsx` — already renders ChatInterface after onboarding
- API pattern: `src/app/api/coach/onboarding/route.ts` — use this as reference for auth and request handling
- Database: `src/lib/supabase/database.types.ts` — needs push_subscriptions table type added
- Design: DESIGN.md — use Museum Gallery palette (blacks, whites, warm oranges)
- The coach_profiles table has training_background and onboarding_complete fields
- Existing migrations pattern in supabase/migrations/

## Acceptance Criteria
- [ ] Service worker (`public/sw.js`) registered and handles push events
- [ ] User can opt in/out of notifications via coach page settings after onboarding
- [ ] Push subscription saved to Supabase push_subscriptions table
- [ ] API POST `/api/coach/notifications` registers subscription
- [ ] API DELETE `/api/coach/notifications` unregisters subscription
- [ ] API POST `/api/coach/notifications/send` triggers notifications (cron-ready)
- [ ] Notification displays with workout info and opens /coach on click
- [ ] Database migration creates push_subscriptions table with RLS
- [ ] `npm run check` passes (no TypeScript errors)
- [ ] `web-push` package installed

## Implementation Files to Create

### 1. `public/sw.js` — Service Worker
- Listen for `push` event and display notification
- Notification click opens `/coach` page
- Use appropriate title and body from push event data

### 2. `src/lib/agent/notifications.ts` — Notification Service
- `registerPushSubscription(userId, subscription)` — save to DB
- `sendWorkoutReminder(userId, dayName)` — send via web-push npm package
- Read training schedule/frequency from coach_profiles
- Use VAPID keys from env (NEXT_PUBLIC_VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY)

### 3. `src/app/api/coach/notifications/route.ts`
- POST: register push subscription (validate and save to DB)
- DELETE: unsubscribe user (delete from push_subscriptions)

### 4. `src/app/api/coach/notifications/send/route.ts`
- POST: trigger sending reminders
- Check which users have workouts today based on training_frequency
- Send push to subscribed users (batched if many)
- Return count of notifications sent

### 5. `supabase/migrations/007_push_subscriptions.sql`
- Create push_subscriptions table with:
  - id (UUID primary key)
  - user_id (FK to auth.users)
  - subscription (JSONB with endpoint, keys)
  - created_at (TIMESTAMPTZ)
- Add RLS policy: users can only manage their own subscriptions
- Add index on user_id

### 6. Update `src/lib/supabase/database.types.ts`
- Add push_subscriptions Row type with id, user_id, subscription (any), created_at

### 7. Modify `src/app/coach/page.tsx`
- After onboarding complete, show notification opt-in toggle/button
- Request browser permission when clicked
- Register service worker
- Call POST /api/coach/notifications to save subscription
- Show success/error feedback

## Implementation Notes
- Follow existing API pattern from coach/onboarding/route.ts (auth check, error handling)
- Use Tailwind + Museum Gallery colors: bg-elevated (#0F0F0F), accent-orange (#E66A23)
- Service worker must be at `public/sw.js` (not in src/)
- VAPID keys must be generated and set in environment
- Subscription endpoint, auth key, p256dh key should all be saved in JSONB
- Notification object should include title, body, icon (optional), badge (optional)
- Test that notifications can be sent via sendWorkoutReminder() before deploying cron
- Type subscription as `any` if web-push types not available

## Dependencies
- `web-push` npm package (install as regular dependency, not dev)
- Environment variables: NEXT_PUBLIC_VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY
- No other new dependencies needed

## Notes
- Do not modify ChatInterface or OnboardingWizard components
- Keep env variable setup instructions for user (they must generate VAPID keys)
- Test npm run check passes with all new files
