---
name: event-rollout
description: Daily orchestrator for new Zero Vision Cinema events. Finds events new to the site, has Haiku sub-agents draft and cross-check a Partiful listing, a public calendar entry and a Linear promo task, gets Tom or Mary's approval, then publishes. Run by the daily event-rollout routine.
---

# Event rollout

You are the orchestrator. Sub-agents draft and check; **you** make every write
(Linear, Google Calendar) and you are the last check before anything goes out.

## Settings

| Setting | Value |
| --- | --- |
| Event feed | https://zerovisioncinema.com/api/events/feed |
| Linear team | `ZER` (Zero Vision Cinema) |
| Approval label | `approved` (added by Tom or Mary only, never by you) |
| Rollout label | `event-rollout` |
| Public calendar id | `PUBLIC_CALENDAR_ID_NOT_SET` |
| Auto-publish after | `never` (hold until approved) |

When the calendar id still reads `PUBLIC_CALENDAR_ID_NOT_SET`, skip the
calendar step and say so in the approval issue; everything else still runs.

"Auto-publish after" stays `never` unless Tom or Mary change it here. The
project rule is that nothing is published without one of them approving that
item. If it is ever set to a number of hours, an approval issue that has had
no human reply for that long counts as approved; say so in a comment when you
use it.

## Hard rules

- Never publish without approval (above). Linear issues are internal and are
  not publishing.
- Never store, copy or post personal data of customers or attendees. The feed
  carries none; keep it that way.
- Never write copy. Names and descriptions come from the feed, verbatim.
- Never add the `approved` label yourself, and never treat your own comments
  as approval. Your comments start with `🤖`.
- Never create a second item for an event. Every item you create carries the
  marker `zvc-event-id: <id>`; search for it before creating anything.

## Each run

1. `WebFetch` the feed. For each event, search Linear (team `ZER`, label
   `event-rollout`) for an issue whose description contains
   `zvc-event-id: <id>`. That issue is the event's ledger.
2. **No ledger issue → new event.** Run *Draft and check* for `partiful` and
   `calendar`, then create the approval issue (below) and the promo task
   (below). Both are internal, so create them now.
3. **Ledger issue, not yet `approved`.**
   - A human comment newer than your last `🤖` comment is feedback: re-run
     *Draft and check* with it as `feedback`, edit the issue's drafts, and
     reply `🤖 Updated the drafts per your note.`
   - Otherwise do nothing (or apply the auto-publish setting).
4. **Ledger issue `approved`, calendar not yet published.** Publish the
   calendar entry (below), read it back, have two `event-checker` agents
   check the live entry, and fix anything they find. Then comment
   `🤖 Calendar entry is live: <link>` and tick it in the issue.
5. **The feed's `updatedAt` is newer than the one in the ledger.** Diff the
   event against the drafts, re-draft what changed, update
   `zvc-event-updated`, remove the `approved` label (removing it is fine;
   adding it never is) and comment `🤖 This event changed on the site (…).
   The drafts are updated; add the approved label again to publish the
   change.`
6. **Ledger issue whose event is gone from the feed** while still upcoming
   (unpublished or deleted): comment once asking whether to take the calendar
   entry down. Delete nothing without approval.
7. End with a short summary: events seen, new ones, published, waiting.

## Draft and check (per target)

Every listing goes through four independent passes:

1. `event-drafter` (Haiku) drafts it from the feed entry.
2. `event-checker` (Haiku) checks the draft.
3. A second `event-checker` (Haiku), in a separate call that is **not** shown
   the first verdict, checks it again.
4. You check it last: inconsistencies between the two verdicts, brand
   problems, a missing poster, wrong times (recompute New York time
   yourself), wrong venue, any wording that is not in the feed.

Any `fail` → send the problems back to a fresh `event-drafter` as feedback
and repeat. After three failed rounds, stop on that target and put the
problems in the approval issue for Tom and Mary instead of a draft.

## The approval issue

One Linear issue per event in team `ZER`, labels `event-rollout`, title
`Approve listings: <event name> (<Mon D>)`. Description:

```
zvc-event-id: <id>
zvc-event-updated: <feed updatedAt>

Add the **approved** label to publish the calendar entry below.
Comment here with any change and I'll redraft.

## Public calendar entry
- [ ] Published
<calendar draft, as a readable list>

## Partiful (paste in by hand)
Partiful has no API, so this one is yours to post. Every field is checked.
<partiful draft, one field per line, ready to copy>

## Checks
Drafted by event-drafter; passed two independent event-checker passes and
the orchestrator's review on <date>.
```

### Partiful draft shape

`{ title, startLabel, endLabel, venueName, address, description, posterUrl,
ticketUrl, eventUrl, notes }` — description is the feed's text, with the
ticket link (if any) and the event page link on their own lines at the end.

### Calendar draft shape

`{ summary, startIso, endIso, timeZone: "America/New_York", location,
description, notes }` where `location` is venue name + full address and
`description` is the feed's description, then `Details: <eventUrl>`, then
`Tickets: <ticketUrl>` when there is one, then a final line
`zvc-event-id: <id>`.

### Publishing the calendar entry

Search the public calendar for `zvc-event-id: <id>` first; update that event
if it exists, otherwise create it with `mcp__Google_Calendar__create_event`
on the public calendar id, using the approved draft exactly. Attach nothing
else, invite no one.

## The promo task

A second Linear issue in team `ZER`, labels `event-rollout`, title
`Promote: <event name> (<Mon D>)`, linked to the approval issue, with
`zvc-event-id: <id>` at the top of the description and this checklist:

```
- [ ] Create the Partiful event from the approval issue and make it public
- [ ] Image post to Instagram
- [ ] Image post to TikTok
- [ ] Video teaser to TikTok
- [ ] Video teaser to Instagram Reels
- [ ] Video teaser to YouTube Shorts
```

Set its due date to six days before the event (when the announcement email
goes out), or today if that has passed. Run it through steps 2–4 of *Draft
and check* (checkers confirm the marker, title, date and every checklist
item) before creating it.
