import { NextResponse } from 'next/server';

// Webhook endpoint to receive downtime alerts (e.g., from UptimeRobot or PagerDuty)
export async function POST(req: Request) {
  try {
    const payload = await req.json();
    
    console.log(`[ALERT] Uptime monitoring triggered! Status: ${payload.status}`);
    
    // In a real scenario, this would notify the team via Slack, SMS, or trigger a failover protocol.
    if (payload.status === 'down') {
      console.error('CRITICAL: Site is down! Initiating incident response...');
    }

    return NextResponse.json({ success: true, message: 'Alert received' });
  } catch (error) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }
}
