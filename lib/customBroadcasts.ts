import {
  APIError,
  type CollectionAfterDeleteHook,
  type CollectionBeforeChangeHook,
  type Payload,
  type PayloadRequest,
} from "payload";
import { logtail } from "@/lib/logtail";
import {
  RESEND_BROADCASTS_API_URL,
  RESEND_EMAILS_API_URL,
  ZVC_DISPLAY_NAME_EMAIL,
} from "@/app/contsants/constants";
import type { CustomBroadcastImage } from "@/emails/CustomBroadcastEmail";

/**
 * Custom (hand-written) email broadcasts.
 *
 * Unlike the event announcement/reminder broadcasts, these are not dispatched
 * by QStash. Saving an entry as `send` creates a Resend broadcast: with
 * `scheduled` on, it carries `scheduled_at` and Resend holds it until then;
 * with it off, Resend sends it immediately. Either way the send is committed —
 * with the HTML rendered right then — at save time, and every later edit of a
 * scheduled entry cancels that broadcast and schedules a fresh one.
 *
 * An immediate send stamps `sendAt` with the save time, so the lock below
 * freezes the entry from then on exactly as it does a scheduled one.
 */

/** Earliest a send may be scheduled, from now. */
export const MIN_LEAD_MS = 10 * 60 * 1000;
/**
 * Once a scheduled send is this close (or past), the entry is frozen. Replacing
 * the Resend broadcast takes two calls, and doing that while the old one is
 * going out could mail the segment twice.
 */
export const LOCK_WINDOW_MS = 5 * 60 * 1000;

/**
 * The only thing that lets a save reach the real audience. Set to `true` in
 * Vercel Production alone — local dev and preview deployments share the Resend
 * account, so without this gate sending a test entry would mail everyone.
 * The `test` segment is exempt: that is what development schedules against.
 */
export const broadcastSendingEnabled = () =>
  process.env.BROADCAST_SENDING_ENABLED === "true";

/**
 * Which Resend segment a broadcast goes to. `main` is the real mailing list;
 * `test` is a small segment of our own addresses, for running the whole flow —
 * scheduling, rescheduling, cancelling, the live unsubscribe link — without
 * mailing anyone. Adding a segment means adding it here AND to the
 * `enum_custom_broadcasts_segment` Postgres enum in a migration.
 */
export const BROADCAST_SEGMENTS = {
  main: { label: "Everyone (main list)", env: "RESEND_SEGMENT_ID" },
  test: { label: "Test segment (development)", env: "RESEND_TEST_SEGMENT_ID" },
} as const;
export type BroadcastSegment = keyof typeof BROADCAST_SEGMENTS;

type BroadcastData = {
  segment?: BroadcastSegment | null;
  subject?: string | null;
  heading?: string | null;
  images?: unknown[] | null;
  body?: unknown;
  cta?: {
    enabled?: boolean | null;
    label?: string | null;
    url?: string | null;
  };
  status?: "draft" | "send" | null;
  scheduled?: boolean | null;
  sendAt?: string | null;
  sendTestTo?: string | null;
  resendBroadcastId?: string | null;
};

const fail = (message: string, status = 400) =>
  new APIError(message, status, null, true);

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Call the Resend REST API with the FULL-access key (the sending-only
 * RESEND_API_KEY is rejected by the broadcasts endpoints). Retries once on 429:
 * the account limit is a couple of requests a second and a reschedule makes two.
 */
async function resendFetch(
  url: string,
  method: "POST" | "DELETE",
  body?: unknown,
): Promise<Response> {
  const key = process.env.RESEND_FULL_API_KEY;
  if (!key) throw fail("RESEND_FULL_API_KEY is not set.", 500);

  const call = () =>
    fetch(url, {
      method,
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });

  let res = await call();
  if (res.status === 429) {
    await sleep(1100);
    res = await call();
  }
  return res;
}

/**
 * Delete a Resend broadcast, which also cancels it if it is scheduled. A 404
 * means it is already gone, which is the state we wanted.
 */
async function deleteResendBroadcast(id: string): Promise<void> {
  const res = await resendFetch(`${RESEND_BROADCASTS_API_URL}/${id}`, "DELETE");
  if (!res.ok && res.status !== 404) {
    throw new Error(`Resend delete ${res.status}: ${await res.text()}`);
  }
}

/** Upload fields arrive as ids or populated docs depending on the caller. */
const relationId = (value: unknown): number | string | undefined => {
  if (value == null) return undefined;
  if (typeof value === "object") return (value as { id?: number | string }).id;
  return value as number | string;
};

/**
 * Resolve media ids to absolute blob URLs, in the given order. Exported so the
 * admin preview route renders the same images as the send path.
 */
export async function resolveBroadcastImages(
  payload: Payload,
  ids: (number | string)[],
  req?: PayloadRequest,
): Promise<CustomBroadcastImage[]> {
  if (ids.length === 0) return [];

  const { docs } = await payload.find({
    collection: "media",
    where: { id: { in: ids } },
    limit: ids.length,
    pagination: false,
    depth: 0,
    ...(req ? { req } : {}),
  });
  const byId = new Map(docs.map((doc) => [String(doc.id), doc]));
  const base = (process.env.VERCEL_BLOB_URL ?? "").replace(/\/$/, "");

  return ids.flatMap((id) => {
    const media = byId.get(String(id));
    if (!media?.filename) return [];
    return [
      {
        url: `${base}/${encodeURIComponent(media.filename)}`,
        alt: media.alt,
        width: media.width,
        height: media.height,
      },
    ];
  });
}

/** Resolve the entry's uploads to absolute blob URLs, in the entry's order. */
async function resolveImages(
  images: unknown[] | null | undefined,
  req: PayloadRequest,
): Promise<CustomBroadcastImage[]> {
  const ids = (images ?? [])
    .map(relationId)
    .filter((id): id is number | string => id != null);
  return resolveBroadcastImages(req.payload, ids, req);
}

/** One line: a newline in a subject header gets stripped or mangled. */
const cleanSubject = (subject?: string | null) =>
  (subject ?? "").replace(/\s+/g, " ").trim();

export type BroadcastRenderProps = {
  /** Inbox preview line; also the fallback headline. */
  subject?: string | null;
  heading?: string | null;
  /** Already resolved to absolute URLs — see resolveBroadcastImages. */
  images?: CustomBroadcastImage[];
  body?: unknown;
  cta?: { label: string; url: string } | null;
};

/**
 * Renders a broadcast to its send-ready HTML. Exported so the admin preview
 * route uses the exact same template path as the save-time send — what Tom
 * sees in the preview is what subscribers would receive.
 */
export async function renderBroadcastHtml(
  props: BroadcastRenderProps,
): Promise<string> {
  // Imported here, not at the top: this module is part of the Payload config
  // graph, which the `payload migrate` CLI loads during the production build.
  // Keeping the .tsx template out of that graph means a JSX-loader problem can
  // never take a deploy down.
  const [{ render }, { createElement }, { default: CustomBroadcastEmail }] =
    await Promise.all([
      import("@react-email/render"),
      import("react"),
      import("@/emails/CustomBroadcastEmail"),
    ]);

  const cta =
    props.cta?.label && props.cta?.url
      ? { label: props.cta.label, url: props.cta.url }
      : null;

  return render(
    createElement(CustomBroadcastEmail, {
      subject: cleanSubject(props.subject),
      heading: props.heading,
      images: props.images ?? [],
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      body: props.body as any,
      cta,
    }),
  );
}

async function renderHtml(
  data: BroadcastData,
  req: PayloadRequest,
): Promise<string> {
  return renderBroadcastHtml({
    subject: data.subject,
    heading: data.heading,
    images: await resolveImages(data.images, req),
    body: data.body,
    cta:
      data.cta?.enabled && data.cta.label && data.cta.url
        ? { label: data.cta.label, url: data.cta.url }
        : null,
  });
}

async function sendTest(to: string, subject: string, html: string) {
  const res = await resendFetch(RESEND_EMAILS_API_URL, "POST", {
    from: ZVC_DISPLAY_NAME_EMAIL,
    to,
    subject: `[TEST] ${subject}`,
    html,
  });
  if (!res.ok) {
    throw fail(`Test send failed — Resend ${res.status}: ${await res.text()}`);
  }
}

export const syncCustomBroadcast: CollectionBeforeChangeHook = async ({
  data: incoming,
  originalDoc,
  req,
}) => {
  const data = incoming as BroadcastData;
  const original = (originalDoc ?? {}) as BroadcastData;
  const now = Date.now();

  // 1. Frozen once the scheduled send is imminent or has happened.
  if (
    original.status === "send" &&
    original.resendBroadcastId &&
    original.sendAt &&
    new Date(original.sendAt).getTime() - now < LOCK_WINDOW_MS
  ) {
    throw fail(
      "This broadcast has already been sent (or is sending now) and can no longer be changed. Create a new broadcast instead.",
    );
  }

  const subject = cleanSubject(data.subject);
  data.subject = subject;

  const testTo = data.sendTestTo?.trim();
  delete data.sendTestTo;

  const sending = data.status === "send";
  const scheduling = sending && Boolean(data.scheduled);
  const previousId = original.resendBroadcastId ?? null;

  const segment = data.segment ?? original.segment;
  const isTest = segment === "test";
  let segmentId: string | undefined;

  if (sending) {
    // No fallback to the main list: an entry with no segment must never be
    // interpreted as "everyone".
    if (!segment || !(segment in BROADCAST_SEGMENTS)) {
      throw fail("Choose which segment this broadcast goes to.");
    }
    if (!isTest && !broadcastSendingEnabled()) {
      throw fail(
        'Sending to the main list is disabled in this environment (BROADCAST_SENDING_ENABLED is not "true"). Use the Test segment, or keep the entry as a draft — "Send test to" still works.',
      );
    }
    const { env } = BROADCAST_SEGMENTS[segment];
    segmentId = process.env[env];
    if (!segmentId) throw fail(`${env} is not set.`, 500);
    if (scheduling) {
      if (!data.sendAt) throw fail("Pick a send date and time to schedule.");
      if (new Date(data.sendAt).getTime() - now < MIN_LEAD_MS) {
        throw fail("Send time must be at least 10 minutes from now.");
      }
    } else {
      // Sending now: record when, which also locks the entry from here on.
      data.sendAt = new Date(now).toISOString();
    }
  }

  const html = testTo || sending ? await renderHtml(data, req) : undefined;

  // 2. Test send — one address, works on drafts and in every environment.
  if (testTo && html) await sendTest(testTo, subject, html);

  // 3. Back to draft: cancel whatever Resend is holding.
  if (!sending) {
    if (previousId) {
      try {
        await deleteResendBroadcast(previousId);
      } catch (err) {
        await logtail.error(`custom-broadcasts: unschedule failed: ${err}`);
        throw fail(
          `Could not cancel the scheduled broadcast in Resend, so nothing was changed. ${err}`,
          502,
        );
      }
    }
    data.resendBroadcastId = null;
    return data;
  }

  // 4. Sending now replaces a pending scheduled send, so cancel that first: an
  // immediate broadcast can't be taken back if the cancel then failed.
  if (!scheduling && previousId) {
    try {
      await deleteResendBroadcast(previousId);
    } catch (err) {
      await logtail.error(
        `custom-broadcasts: cancel before send failed: ${err}`,
      );
      throw fail(
        `Could not cancel the previously scheduled broadcast in Resend, so nothing was sent. ${err}`,
        502,
      );
    }
  }

  // 5. Send or schedule. When rescheduling, create the new broadcast first,
  // then cancel the old one, so a failure at any point leaves at most one
  // scheduled — never zero silently and never two.
  const res = await resendFetch(RESEND_BROADCASTS_API_URL, "POST", {
    segment_id: segmentId,
    from: ZVC_DISPLAY_NAME_EMAIL,
    subject: isTest ? `[TEST] ${subject}` : subject,
    // Shown only in the Resend dashboard; the prefix tells these apart from the
    // event broadcasts.
    name: `${isTest ? "[custom test]" : "[custom]"} ${subject}`,
    html,
    send: true,
    // Omitted, Resend sends immediately.
    ...(scheduling && { scheduled_at: new Date(data.sendAt!).toISOString() }),
  });
  if (!res.ok) {
    const detail = await res.text();
    await logtail.error(
      `custom-broadcasts: send failed — Resend ${res.status}: ${detail}`,
    );
    throw fail(
      `Resend rejected the broadcast (${res.status}): ${detail}` +
        (!scheduling && previousId
          ? " The previously scheduled send was already cancelled, so nothing is pending now."
          : ""),
      502,
    );
  }
  const { id: newId } = (await res.json()) as { id?: string };
  if (!newId) throw fail("Resend returned no broadcast id.", 502);

  if (scheduling && previousId) {
    try {
      await deleteResendBroadcast(previousId);
    } catch (err) {
      // The old one is still scheduled, so the new one has to go.
      await deleteResendBroadcast(newId).catch((undoErr) =>
        logtail.error(
          `custom-broadcasts: TWO broadcasts may be scheduled — could not remove ${newId} after failing to cancel ${previousId}: ${undoErr}. Check the Resend dashboard.`,
        ),
      );
      await logtail.error(`custom-broadcasts: reschedule failed: ${err}`);
      throw fail(
        `Could not replace the previously scheduled broadcast in Resend, so nothing was changed. ${err}`,
        502,
      );
    }
  }

  data.resendBroadcastId = newId;
  return data;
};

/** Deleting an entry that hasn't gone out yet cancels it in Resend too. */
export const cancelCustomBroadcast: CollectionAfterDeleteHook = async ({
  doc,
}) => {
  const { resendBroadcastId, sendAt } = doc as BroadcastData;
  if (!resendBroadcastId || !sendAt) return;
  if (new Date(sendAt).getTime() <= Date.now()) return; // already sent

  try {
    await deleteResendBroadcast(resendBroadcastId);
  } catch (err) {
    await logtail.error(
      `custom-broadcasts: entry deleted but Resend broadcast ${resendBroadcastId} could NOT be cancelled and will still send: ${err}`,
    );
  }
};
