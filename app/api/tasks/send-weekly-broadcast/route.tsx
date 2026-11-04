import { NextResponse } from 'next/server';
import { getPayload } from 'payload';
import payloadConfig from '@payload-config';
import { render } from '@react-email/render';
import { logtail } from '@/lib/logtail';
import { verifyQstashRequest } from '@/lib/qstash';
import {
  postedThisPastWeek,
  toWeeklyEvent,
  weeklyBroadcastName,
} from '@/lib/weeklyBroadcast';
import {
  RESEND_BROADCASTS_API_URL,
  ZVC_DISPLAY_NAME_EMAIL,
  ZVC_SITE_URL,
} from '@/app/contsants/constants';
import WeeklyEmail, {
  weekRangeLabel,
  type WeeklyMedia,
} from '@/emails/WeeklyEmail';
import type { Event } from '@/payload-types';
import {
  etDateKey,
  etDayRangeUtc,
  etWeekRangeUtc,
} from '@/utils/broadcastSchedule';
import { getLatestSubstackPosts } from '@/utils/getLatestSubstackPosts';
import { getLatestYouTubeVideo } from '@/utils/getLatestYouTubeVideo';

/**
 * QStash-delivered task: send the Sunday "This week at ZVC" broadcast — every
 * published event from today (Sunday, ET) through Saturday in one email, plus
 * the latest YouTube video and Substack post when they went up in the past
 * week. Dispatched by the 9am ET daily run on Sundays.
 *
 * Goes to the whole audience segment under the weekly Resend topic
 * (RESEND_TOPIC_ID_WEEKLY), so people can unsubscribe from it on its own.
 *
 * Idempotent per week: the broadcast is named for the week's Sunday, and an
 * existing broadcast with that name in Resend means it already went out. Resend
 * is the record, so nothing new is stored on our side.
 */
export async function POST(req: Request) {
  try {
    await verifyQstashRequest(req);
  } catch (err) {
    await logtail.error(
      `API /tasks/send-weekly-broadcast: signature verification failed: ${err}`
    );
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const now = new Date();
  const dateKey = etDateKey(now);
  const name = weeklyBroadcastName(dateKey);

  try {
    const segmentId = process.env.RESEND_SEGMENT_ID;
    const topicId = process.env.RESEND_TOPIC_ID_WEEKLY;
    if (!segmentId || !topicId) {
      // Not configured yet — skip loudly rather than retry forever, and never
      // send without a topic (that would ignore weekly unsubscribes).
      await logtail.error(
        `API /tasks/send-weekly-broadcast: ${
          !segmentId ? 'RESEND_SEGMENT_ID' : 'RESEND_TOPIC_ID_WEEKLY'
        } not set; skipping ${name}`
      );
      return NextResponse.json({ received: true, skipped: true }, { status: 200 });
    }

    const resendKey = process.env.RESEND_FULL_API_KEY;
    if (!resendKey) {
      throw new Error(
        'RESEND_FULL_API_KEY is not set — the broadcasts API rejects the ' +
          'sending-only RESEND_API_KEY'
      );
    }
    const headers = {
      Authorization: `Bearer ${resendKey}`,
      'Content-Type': 'application/json',
    };

    // Already sent this week? (A QStash retry, or a re-run by hand.)
    const listRes = await fetch(`${RESEND_BROADCASTS_API_URL}?limit=50`, {
      headers,
    });
    if (!listRes.ok) {
      throw new Error(
        `Resend list broadcasts ${listRes.status}: ${await listRes.text()}`
      );
    }
    const existing = ((await listRes.json()) as { data?: { name?: string }[] })
      .data;
    if (existing?.some((b) => b.name === name)) {
      return NextResponse.json(
        { received: true, skipped: true, reason: 'already sent' },
        { status: 200 }
      );
    }

    const { start, end } = etWeekRangeUtc(now);
    const payload = await getPayload({ config: payloadConfig });
    const { docs } = await payload.find({
      collection: 'events',
      where: {
        _status: { equals: 'published' },
        datetime: {
          // From now, not midnight: anything earlier today has already started.
          greater_than_equal: now.toISOString(),
          less_than: end.toISOString(),
        },
      },
      sort: 'datetime',
      limit: 100,
      pagination: false,
      depth: 1,
    });

    // Nothing on this week: no email.
    if (docs.length === 0) {
      return NextResponse.json(
        { received: true, skipped: true, reason: 'no events this week' },
        { status: 200 }
      );
    }

    const [events, [post], video] = await Promise.all([
      Promise.all((docs as Event[]).map(toWeeklyEvent)),
      getLatestSubstackPosts(1),
      getLatestYouTubeVideo(),
    ]);

    const recentVideo: WeeklyMedia | null =
      video && postedThisPastWeek(video.publishedAt, now)
        ? { title: video.title, url: video.url, imageUrl: video.thumbnailUrl }
        : null;
    const recentPost: WeeklyMedia | null =
      post && postedThisPastWeek(post.publishedAt, now)
        ? { title: post.title, url: post.url, imageUrl: post.imageUrl }
        : null;

    // Saturday's date for the "Nov 8 – Nov 14" label.
    const weekEnd = etDayRangeUtc(now, 6).start.toISOString();
    const html = await render(
      <WeeklyEmail
        weekStart={start.toISOString()}
        weekEnd={weekEnd}
        events={events}
        moreEventsUrl={`${ZVC_SITE_URL}/events`}
        video={recentVideo}
        post={recentPost}
      />
    );

    let res: Response;
    try {
      res = await fetch(RESEND_BROADCASTS_API_URL, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          name,
          segment_id: segmentId,
          topic_id: topicId,
          from: ZVC_DISPLAY_NAME_EMAIL,
          subject: `This week at ZVC: ${weekRangeLabel(start.toISOString(), weekEnd)}`,
          html,
          send: true,
        }),
      });
    } catch (sendErr) {
      // Outcome unknown — Resend may have accepted it. Don't retry: a missed
      // week can be re-sent by hand; a double send can't be taken back. If it
      // did go through, the name check above stops any re-run anyway.
      await logtail.error(
        `API /tasks/send-weekly-broadcast: ${name} failed in flight: ${sendErr}. ` +
          'NOT retried — check Resend, and re-send by hand if nothing went out.'
      );
      return NextResponse.json({ received: true, ambiguous: true }, { status: 200 });
    }

    if (!res.ok) {
      // Rejected outright, so nothing was created and a retry is safe.
      throw new Error(`Resend broadcast ${res.status}: ${await res.text()}`);
    }

    return NextResponse.json(
      { received: true, events: events.length, video: !!recentVideo, post: !!recentPost },
      { status: 200 }
    );
  } catch (err) {
    await logtail.error(`API /tasks/send-weekly-broadcast: ${name} failed: ${err}`, {
      method: 'POST',
      timestamp: new Date().toISOString(),
    });
    return NextResponse.json({ error: 'Weekly broadcast failed' }, { status: 500 });
  }
}
