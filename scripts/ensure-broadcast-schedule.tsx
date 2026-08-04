/**
 * Create (or update) the daily QStash schedule that drives event broadcasts.
 *
 *   npm run schedule:broadcasts -- --dry-run   # show the schedule + what exists
 *   npm run schedule:broadcasts                # upsert it
 *   npm run schedule:broadcasts -- --delete    # remove it
 *
 * Runs through `scripts/with-prod-env.sh`, which pulls the production env from
 * Vercel and deletes it afterwards. The production QSTASH_TOKEN is marked
 * Sensitive in Vercel and pulls as the literal "[SENSITIVE]", so the npm script
 * sets PROD_ENV_FALLBACK=QSTASH_TOKEN to take the value from .env.local — the
 * same Upstash project, confirmed by production accepting a signed request from
 * that token.
 *
 * Idempotent: a fixed `scheduleId` makes create() update the existing schedule
 * rather than stacking duplicates, so this is safe to re-run.
 */
import { qstash, QSTASH_TARGET_BASE_URL } from '@/lib/qstash';

const SCHEDULE_ID = 'daily-event-broadcasts';
const DESTINATION = `${QSTASH_TARGET_BASE_URL}/api/tasks/send-due-broadcasts`;
const FAILURE_URL = `${QSTASH_TARGET_BASE_URL}/api/tasks/send-due-broadcasts/failure`;

// QStash evaluates cron in the given IANA zone, so this stays 9am ET across DST.
// Vercel cron could not do this — its expressions are always UTC.
const CRON = 'CRON_TZ=America/New_York 0 9 * * *';

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const doDelete = process.argv.includes('--delete');

  console.log(`schedule  ${SCHEDULE_ID}`);
  console.log(`cron      ${CRON}`);
  console.log(`destination ${DESTINATION}`);
  console.log('');

  const existing = await qstash.schedules.list();
  const ours = existing.filter((s) => s.scheduleId === SCHEDULE_ID);

  console.log(`${existing.length} schedule(s) currently on the account:`);
  for (const s of existing) {
    console.log(
      `  ${s.scheduleId}  ${s.cron}  → ${s.destination}${
        s.scheduleId === SCHEDULE_ID ? '   ← this one' : ''
      }`
    );
  }
  console.log('');

  if (doDelete) {
    if (ours.length === 0) {
      console.log('Nothing to delete.');
      return;
    }
    if (dryRun) {
      console.log(`DRY RUN: would delete ${SCHEDULE_ID}`);
      return;
    }
    await qstash.schedules.delete(SCHEDULE_ID);
    console.log(`Deleted ${SCHEDULE_ID}.`);
    return;
  }

  if (dryRun) {
    console.log(
      ours.length > 0
        ? `DRY RUN: would update the existing ${SCHEDULE_ID}`
        : `DRY RUN: would create ${SCHEDULE_ID}`
    );
    return;
  }

  const res = await qstash.schedules.create({
    scheduleId: SCHEDULE_ID,
    destination: DESTINATION,
    cron: CRON,
    retries: 3,
    failureCallback: FAILURE_URL,
  });

  console.log(`${ours.length > 0 ? 'Updated' : 'Created'} ${res.scheduleId}.`);
  console.log('Broadcasts now go out at 9:00am ET daily.');
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
