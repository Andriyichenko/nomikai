import { NextResponse } from "next/server";
import { sendDayOfReminders } from "@/lib/notify";

/**
 * Morning-of reminder, called once a day by .github/workflows/day-of-reminder.yml
 * (Authorization: Bearer $CRON_SECRET). Safe to call repeatedly: each attendee is mailed once.
 * `?dry=1` reports who would be mailed without sending.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const dryRun = new URL(request.url).searchParams.get("dry") === "1";
  try {
    return NextResponse.json(await sendDayOfReminders({ dryRun }));
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
