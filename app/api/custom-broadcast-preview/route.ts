import { NextRequest, NextResponse } from "next/server";
import { getPayload } from "payload";
import payloadConfig from "@payload-config";
import {
  renderBroadcastHtml,
  resolveBroadcastImages,
} from "@/lib/customBroadcasts";

type PreviewInput = {
  subject?: unknown;
  heading?: unknown;
  imageIds?: unknown;
  body?: unknown;
  cta?: unknown;
};

/**
 * Admin-only preview for the Custom Broadcasts collection: renders the draft's
 * current field values through the exact send template and returns the HTML.
 * Nothing is sent and nothing is written — a pure render of unsaved data, so
 * it is safe to preview from any environment.
 */
export async function POST(req: NextRequest) {
  const payload = await getPayload({ config: payloadConfig });

  // Admin-only: the rendered email and media URLs are internal until sent.
  const { user } = await payload.auth({ headers: req.headers });
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let input: PreviewInput;
  try {
    input = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Expected a JSON body." },
      { status: 400 },
    );
  }

  const asText = (value: unknown): string | null =>
    typeof value === "string" ? value : null;

  const imageIds = Array.isArray(input.imageIds)
    ? input.imageIds.filter(
        (id): id is number | string =>
          typeof id === "number" || typeof id === "string",
      )
    : [];

  const ctaValue = input.cta as { label?: unknown; url?: unknown } | null;
  const cta =
    ctaValue &&
    typeof ctaValue.label === "string" &&
    typeof ctaValue.url === "string"
      ? { label: ctaValue.label, url: ctaValue.url }
      : null;

  const html = await renderBroadcastHtml({
    subject: asText(input.subject),
    heading: asText(input.heading),
    images: await resolveBroadcastImages(payload, imageIds),
    body: input.body ?? null,
    cta,
  });

  return NextResponse.json({ html });
}
