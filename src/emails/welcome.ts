/**
 * Welcome Email Renderer
 *
 * Generates the transactional welcome email sent immediately on registration.
 *
 * Usage:
 *   const html = renderWelcomeEmail(user.display_name, user.id);
 *   // then send via Resend / Postmark / SES
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

// ── Template loader ────────────────────────────────────────────────────────

function loadTemplate(): string {
  const __dir = dirname(fileURLToPath(import.meta.url));
  return readFileSync(join(__dir, 'welcome.html'), 'utf-8');
}

// ── HTML escape ────────────────────────────────────────────────────────────

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ── Public API ─────────────────────────────────────────────────────────────

/**
 * Render the welcome email for a newly registered user.
 *
 * @param recipientName  The user's display name (used in the greeting).
 * @param userId         The user's ID (used to build the profile CTA link).
 */
export function renderWelcomeEmail(recipientName: string, userId: string): string {
  const template = loadTemplate();
  return template
    .replace(/\{\{recipient_name\}\}/g, escapeHtml(recipientName))
    .replace(/\{\{user_id\}\}/g, encodeURIComponent(userId));
}

/**
 * Render with static placeholder data — useful for design preview
 * and snapshot tests without a live database connection.
 */
export function renderWelcomeEmailPreview(
  recipientName = 'Margaret',
  userId = 'preview-user-id',
): string {
  return renderWelcomeEmail(recipientName, userId);
}
