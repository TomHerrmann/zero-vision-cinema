import { NextRequest, NextResponse } from 'next/server';
import { getPayload } from 'payload';
import payloadConfig from '@payload-config';
import { findUsableReward } from '@/lib/loyalty';
import { logtail } from '@/lib/logtail';

const INVALID_CODE_MESSAGE =
  'That code is invalid, expired, or already used.';

/**
 * Checkout pre-check for a free-ticket code, so the price can show as free
 * before the buyer claims it. Says only whether the code is usable — never who
 * it belongs to. Ownership (the buyer's email) is checked by /api/rewards/redeem.
 */
export async function POST(req: NextRequest) {
  try {
    const { code } = await req.json();
    if (typeof code !== 'string' || !code.trim()) {
      return NextResponse.json({ error: INVALID_CODE_MESSAGE }, { status: 400 });
    }

    const payload = await getPayload({ config: payloadConfig });
    const reward = await findUsableReward(payload, code);
    if (!reward) {
      return NextResponse.json({ error: INVALID_CODE_MESSAGE }, { status: 404 });
    }

    return NextResponse.json({ valid: true, code: reward.code });
  } catch (err) {
    await logtail.error(`API /rewards/validate failed: ${err}`, {
      method: 'POST',
      timestamp: new Date().toISOString(),
    });
    return NextResponse.json(
      { error: 'Could not check that code. Please try again.' },
      { status: 500 }
    );
  }
}
