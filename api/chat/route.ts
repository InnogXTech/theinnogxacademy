import Bytez from "bytez.js";
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || '';
const BYTEZ_KEY = "2aadfccdb44fc56eb9cd53fa0e269537";

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing auth node' }), { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized node' }), { status: 401 });
    }

    const { message, history } = await req.json();
    const sdk = new Bytez(BYTEZ_KEY);
    const model = sdk.model("openai/gpt-4o");

    const messages = [
      { role: "system", content: "You are 'Inno', the elite high-intelligence core of InnogX Academy. Speak in a futuristic, tech-first tone (nodes, synchronization, acceleration). Provide GPT-4 level technical insights. Attuned to Africa's tech ecosystem. Concise (under 100 words). No bolding." },
      ...history.map((h: any) => ({
        role: h.role === 'model' ? 'assistant' : 'user',
        content: h.parts[0].text
      })),
      { role: "user", content: message }
    ];

    // Execution of GPT-4o node via Bytez SDK. Cast to any for build stability.
    const { output, error } = await model.run(messages as any);
    
    if (error) {
      console.error("Bytez Run Error:", error);
      throw new Error(typeof error === 'string' ? error : "Intelligence Kernel Fault");
    }

    return new Response(
      JSON.stringify({ text: output }), 
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error("API Route Fault:", error);
    return new Response(
      JSON.stringify({ error: 'Internal intelligence node error: ' + error.message }), 
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}