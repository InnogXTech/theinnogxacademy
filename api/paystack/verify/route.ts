import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || '';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { reference, userId, courseId, plan } = body || {};
    if (!reference) return new Response(JSON.stringify({ error: 'missing reference' }), { status: 400 });

    const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY || '';
    if (!PAYSTACK_SECRET_KEY) return new Response(JSON.stringify({ error: 'server misconfigured' }), { status: 500 });

    const verifyRes = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
      headers: { Authorization: `Bearer ${PAYSTACK_SECRET_KEY}` }
    });
    const data = await verifyRes.json();
    if (!data || !data.data) return new Response(JSON.stringify({ verified: false, data }), { status: 200 });

    const success = data.data.status === 'success';
    const amount = (data.data.amount || 0) / 100; // Paystack returns kobo

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    if (success) {
      // Persist transaction
      try {
        await supabase.from('transactions').insert({
          user_id: userId || data.data.customer?.id || null,
          amount: amount,
          status: 'success',
          item_name: courseId ? `Enrollment:${courseId}` : data.data.metadata?.custom_fields?.[0]?.value || 'Payment',
          date: new Date().toISOString(),
          reference: reference
        });

        if (courseId && userId) {
          // mark enrollment payment_verified if remaining balance 0 else leave
          await supabase.from('enrollments').upsert({ student_id: userId, course_id: courseId, payment_verified: true }).eq('student_id', userId).eq('course_id', courseId);
        }
      } catch (e) {
        console.error('DB persist error', e);
      }
    }

    return new Response(JSON.stringify({ verified: success, data }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (err: any) {
    console.error('Paystack verify route error', err);
    return new Response(JSON.stringify({ error: String(err?.message || err) }), { status: 500 });
  }
}
