-- Drop the user-initiated notification-clearing RPCs.
--
-- Slice A originally shipped clear_notification(id) + clear_all_notifications()
-- to let the bell dismiss items without acting on them. That semantic was
-- rejected in browser review: notifications are nag for actionable items, and
-- the only legitimate way to make one go away is to act on the underlying
-- draft. Approve / reject / retract / remove all clear the matching
-- notification inline via the security-definer RPCs; removal hits the
-- defensive `clear_notifications_on_pn_removal` trigger. No independent
-- "dismiss without acting" path remains.
--
-- Keeping unused, granted RPCs around would just be dead surface for future
-- readers to puzzle over.

drop function if exists public.clear_notification(uuid);
drop function if exists public.clear_all_notifications();
