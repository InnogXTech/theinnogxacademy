import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || '';

export async function POST(req: Request) {
  try {
    const raw = await req.text();
    const sig = req.headers.get('x-paystack-signature') || '';
    const secret = process.env.PAYSTACK_SECRET_KEY || '';
    if (!secret) return new Response('no secret configured', { status: 500 });

    const hash = crypto.createHmac('sha512', secret).update(raw).digest('hex');
    if (hash !== sig) {
      return new Response('invalid signature', { status: 401 });
    }

    const event = JSON.parse(raw);
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    if (event?.event === 'charge.success' && event?.data) {
      const reference = event.data.reference;
      const amount = (event.data.amount || 0) / 100;
      const metadata = event.data.metadata || {};

      // Persist transaction and attempt to upsert enrollment
      try {
        await supabase.from('transactions').insert({
          user_id: event.data?.customer?.id || null,
          amount,
          status: 'success',
          item_name: metadata.custom_fields?.[0]?.value || 'Payment',
          date: new Date().toISOString(),
          reference
        });

        // If metadata contains course id or student id try to upsert enrollment
        const courseId = metadata.course_id || null;
        const userId = metadata.userId || null;
        if (courseId && userId) {
          await supabase.from('enrollments').upsert({ student_id: userId, course_id: courseId, payment_verified: true }).eq('student_id', userId).eq('course_id', courseId);
        }
      } catch (e) {
        console.error('webhook persist error', e);
      }
    }

    return new Response(JSON.stringify({ received: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (err: any) {
    console.error('Paystack webhook error', err);
    return new Response(JSON.stringify({ error: String(err?.message || err) }), { status: 500 });
  }
}
