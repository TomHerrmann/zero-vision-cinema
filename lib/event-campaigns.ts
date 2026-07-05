import Anthropic from '@anthropic-ai/sdk';
import MailerLite from '@mailerlite/mailerlite-nodejs';
import { formatEventDateTime } from '@/utils/formatDate';
import { logtail } from './logtail';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const mailerlite = new MailerLite({ api_key: process.env.MAILER_LITE_ACCESS_TOKEN! });

type LexicalNode = { type?: string; text?: string; children?: LexicalNode[] };

function lexicalToText(node: LexicalNode): string {
  if (node.type === 'text') return node.text || '';
  if (!node.children) return '';
  return node.children
    .map(lexicalToText)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
}

type EmailCopy = { subject: string; preview_text: string; html_body: string };
type CampaignCopy = { weekBefore: EmailCopy; dayBefore: EmailCopy };

async function generateEmailCopy(event: {
  name: string;
  descriptionText: string;
  formattedDate: string;
  formattedTime: string;
  locationName: string;
  imageUrl?: string;
  paymentLink?: string;
  price: number;
}): Promise<CampaignCopy> {
  const ticketInfo =
    event.price > 0
      ? `$${event.price} — tickets: ${event.paymentLink}`
      : 'Free to attend';

  const prompt = `You are writing promotional emails for Zero Vision Cinema (ZVC), an indie/art house cinema and horror club in Albany, NY.

Event details:
- Name: ${event.name}
- Date: ${event.formattedDate} at ${event.formattedTime} ET
- Location: ${event.locationName}
- Description: ${event.descriptionText}
- Admission: ${ticketInfo}
${event.imageUrl ? `- Event poster/image: ${event.imageUrl}` : ''}

Write two distinct marketing emails:
1. "weekBefore" — builds anticipation, give people time to plan, conversational
2. "dayBefore" — urgency, last-chance energy, punchy

ZVC voice: cinematic, atmospheric, slightly dark and moody but warm. Film-nerd writing to fellow film nerds. Not corporate, never soulless. Avoid exclamation mark overuse.

For each email return self-contained HTML that renders well in email clients:
- Dark background: #0a0a0a
- Body text: #e5e5e5
- Accent: #a855f7 (purple)
- Max width 600px, centered, inline styles only (no <style> tags)
- If an image URL is provided, show it prominently at ~100% width up to 600px
- A clear CTA button (dark bg with purple border/text) for tickets or "Learn More" on zerovisioncinema.com
- Small footer: "Zero Vision Cinema | 418 Broadway Ste N, Albany, NY | zerovisioncinema.com | Unsubscribe: {{UnsubscribeUrl}}"
  - The {{UnsubscribeUrl}} placeholder is required for MailerLite compliance — include it exactly
- Keep body text under 200 words

Return ONLY valid JSON — no markdown, no code fences:
{
  "weekBefore": { "subject": "...", "preview_text": "...", "html_body": "..." },
  "dayBefore":  { "subject": "...", "preview_text": "...", "html_body": "..." }
}`;

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 8096,
    messages: [{ role: 'user', content: prompt }],
  });

  const content = response.content[0];
  if (content.type !== 'text') throw new Error('Unexpected Claude response type');
  return JSON.parse(content.text) as CampaignCopy;
}

function scheduledSendDate(
  eventDatetime: string,
  daysBeforeEvent: number
): { date: string; hours: string; minutes: string } | null {
  const sendAt = new Date(eventDatetime);
  sendAt.setDate(sendAt.getDate() - daysBeforeEvent);
  sendAt.setUTCHours(14, 0, 0, 0); // 10am ET (summer) / 9am ET (winter)

  if (sendAt <= new Date()) return null; // already in the past
  return {
    date: sendAt.toISOString().split('T')[0],
    hours: '14',
    minutes: '00',
  };
}

export type CampaignIds = {
  weekBeforeCampaignId: string | null;
  dayBeforeCampaignId: string | null;
};

async function deleteCampaignIfExists(id: string | null | undefined) {
  if (!id) return;
  try {
    // Cancel first to move back to draft (required before deletion for scheduled campaigns)
    await mailerlite.campaigns.cancel(id);
  } catch {
    // Already in draft or sent — safe to ignore
  }
  try {
    await mailerlite.campaigns.delete(id);
  } catch {
    // May already be deleted or sent — safe to ignore
  }
}

export async function cancelEventCampaigns(
  weekBeforeCampaignId: string | null | undefined,
  dayBeforeCampaignId: string | null | undefined
) {
  await Promise.all([
    deleteCampaignIfExists(weekBeforeCampaignId),
    deleteCampaignIfExists(dayBeforeCampaignId),
  ]);
}

export async function createEventCampaigns(event: {
  id: string | number;
  name: string;
  description: LexicalNode;
  datetime: string;
  locationName: string;
  imageUrl?: string;
  paymentLink?: string | null;
  price: number;
  weekBeforeCampaignId?: string | null;
  dayBeforeCampaignId?: string | null;
}): Promise<CampaignIds> {
  await deleteCampaignIfExists(event.weekBeforeCampaignId);
  await deleteCampaignIfExists(event.dayBeforeCampaignId);

  const { formattedDate, formattedTime } = formatEventDateTime(event.datetime);
  const descriptionText = lexicalToText(event.description?.root ?? event.description);

  const copy = await generateEmailCopy({
    name: event.name,
    descriptionText,
    formattedDate,
    formattedTime,
    locationName: event.locationName,
    imageUrl: event.imageUrl,
    paymentLink: event.paymentLink ?? undefined,
    price: event.price,
  });

  const groupId = process.env.MAILERLITE_GROUP_ID!;
  const result: CampaignIds = { weekBeforeCampaignId: null, dayBeforeCampaignId: null };

  const weekSchedule = scheduledSendDate(event.datetime, 7);
  if (weekSchedule) {
    const campaign = await mailerlite.campaigns.create({
      name: `${event.name} — 1 Week Before (${weekSchedule.date})`,
      type: 'regular',
      emails: [
        {
          subject: copy.weekBefore.subject,
          from_name: 'Zero Vision Cinema',
          from: 'info@zerovisioncinema.com',
          content: copy.weekBefore.html_body,
        },
      ],
      groups: [groupId],
    });
    const campaignId = campaign.data.data.id;
    await mailerlite.campaigns.schedule(campaignId, {
      delivery: 'scheduled',
      schedule: weekSchedule,
    });
    result.weekBeforeCampaignId = campaignId;
    await logtail.info(`Created week-before campaign ${campaignId} for event "${event.name}"`, {
      eventId: String(event.id),
      scheduledFor: weekSchedule.date,
    });
  } else {
    await logtail.info(`Skipped week-before campaign for "${event.name}" — send date already passed`, {
      eventId: String(event.id),
    });
  }

  const daySchedule = scheduledSendDate(event.datetime, 1);
  if (daySchedule) {
    const campaign = await mailerlite.campaigns.create({
      name: `${event.name} — 1 Day Before (${daySchedule.date})`,
      type: 'regular',
      emails: [
        {
          subject: copy.dayBefore.subject,
          from_name: 'Zero Vision Cinema',
          from: 'info@zerovisioncinema.com',
          content: copy.dayBefore.html_body,
        },
      ],
      groups: [groupId],
    });
    const campaignId = campaign.data.data.id;
    await mailerlite.campaigns.schedule(campaignId, {
      delivery: 'scheduled',
      schedule: daySchedule,
    });
    result.dayBeforeCampaignId = campaignId;
    await logtail.info(`Created day-before campaign ${campaignId} for event "${event.name}"`, {
      eventId: String(event.id),
      scheduledFor: daySchedule.date,
    });
  } else {
    await logtail.info(`Skipped day-before campaign for "${event.name}" — send date already passed`, {
      eventId: String(event.id),
    });
  }

  return result;
}
