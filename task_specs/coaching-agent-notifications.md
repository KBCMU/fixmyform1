# Task: Push Notification Workout Reminders

## Goal
Send web push notifications to remind users about scheduled workouts.

## Architecture
- Web Push API (no Twilio/SMS in v1)
- Service worker handles push events
- User opts in via coach page settings
- Backend sends notifications based on training schedule from coach_profiles

## Files to Create

### 1. `public/sw.js` — Service worker
- Listens for `push` events
- Displays notification with workout info
- On click: opens `/coach` page

### 2. `src/lib/agent/notifications.ts` — Notification service
- `registerPushSubscription(userId, subscription)` — saves to DB
- `sendWorkoutReminder(userId, dayName)` — sends push via web-push npm package
- Reads training schedule from coach_profiles

### 3. `src/app/api/coach/notifications/route.ts`
- POST: register push subscription (save PushSubscription to DB)
- DELETE: unsubscribe

### 4. `src/app/api/coach/notifications/send/route.ts`
- POST: trigger sending reminders (called by cron/Vercel cron)
- Checks which users have workouts today based on their training frequency
- Sends push to subscribed users

### 5. `supabase/migrations/007_push_subscriptions.sql`
```sql
CREATE TABLE push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  subscription JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own subscriptions"
  ON push_subscriptions FOR ALL USING (auth.uid() = user_id);
CREATE INDEX idx_push_subscriptions_user_id ON push_subscriptions(user_id);
```

### 6. Modify `src/app/coach/page.tsx`
- Add notification opt-in toggle/button when onboarding is complete
- Requests browser permission, registers service worker, saves subscription

### 7. Update `src/lib/supabase/database.types.ts`
- Add push_subscriptions table types

## Dependencies
- `web-push` npm package (for server-side push sending)
- VAPID keys in env vars (NEXT_PUBLIC_VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY)

## Acceptance Criteria
- [ ] Service worker registered and handles push events
- [ ] User can opt in/out of notifications
- [ ] Push subscription saved to DB
- [ ] Send endpoint triggers notifications
- [ ] `npm run check` passes
