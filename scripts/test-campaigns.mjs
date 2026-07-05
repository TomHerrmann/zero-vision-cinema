// Run: node --env-file=.env.local scripts/test-campaigns.mjs
// Tests the Anthropic + MailerLite API calls used for event campaigns

import Anthropic from '@anthropic-ai/sdk';
import MailerLite from '@mailerlite/mailerlite-nodejs';

console.log('--- Env check ---');
console.log('ANTHROPIC_API_KEY:', process.env.ANTHROPIC_API_KEY ? `set (${process.env.ANTHROPIC_API_KEY.length} chars)` : 'MISSING');
console.log('MAILER_LITE_ACCESS_TOKEN:', process.env.MAILER_LITE_ACCESS_TOKEN ? 'set' : 'MISSING');
console.log('MAILERLITE_GROUP_ID:', process.env.MAILERLITE_GROUP_ID || 'MISSING');

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const mailerlite = new MailerLite({ api_key: process.env.MAILER_LITE_ACCESS_TOKEN });

// 1. Test Anthropic
console.log('\n--- Testing Anthropic ---');
try {
  const response = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 50,
    messages: [{ role: 'user', content: 'Reply with just: OK' }],
  });
  console.log('Anthropic OK:', response.content[0].text);
} catch (err) {
  console.error('Anthropic FAILED:', err.message);
  process.exit(1);
}

// 2. Test MailerLite - list groups to verify auth
console.log('\n--- Testing MailerLite auth ---');
try {
  const groups = await mailerlite.groups.get({ sort: 'name', limit: 5 });
  console.log('MailerLite auth OK, groups:', groups.data.data.map(g => `${g.id} (${g.name})`));
} catch (err) {
  console.error('MailerLite auth FAILED:', err.message || err);
  process.exit(1);
}

// 3. Test campaign creation (dry run with a far-future date)
console.log('\n--- Testing MailerLite campaign create ---');
const groupId = process.env.MAILERLITE_GROUP_ID;
try {
  const campaign = await mailerlite.campaigns.create({
    name: '[TEST - DELETE ME] ZVC Campaign Test',
    type: 'regular',
    emails: [
      {
        subject: 'Test subject',
        from_name: 'Zero Vision Cinema',
        from: 'info@zerovisioncinema.com',
        content: '<p>Test email body</p>',
      },
    ],
    groups: [groupId],
  });
  const campaignId = campaign.data.data.id;
  console.log('Campaign created OK, id:', campaignId);

  // 4. Test scheduling
  console.log('\n--- Testing MailerLite campaign schedule ---');
  await mailerlite.campaigns.schedule(campaignId, {
    delivery: 'scheduled',
    schedule: {
      date: '2026-12-25',
      hours: '14',
      minutes: '00',
    },
  });
  console.log('Campaign scheduled OK');

  // Clean up
  console.log('\n--- Cleaning up test campaign ---');
  await mailerlite.campaigns.cancel(campaignId);
  await mailerlite.campaigns.delete(campaignId);
  console.log('Test campaign deleted');
} catch (err) {
  console.error('MailerLite campaign FAILED:', err.response?.data || err.message || err);
  process.exit(1);
}

console.log('\nAll checks passed!');
