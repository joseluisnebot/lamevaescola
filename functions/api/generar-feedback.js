export async function onRequestPost(context) {
  const { request, env } = context;

  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Content-Type": "application/json",
  };

  try {
    const body = await request.json();
    const { nom, situacio, millora, puntFort, nivell, destinatari, tono } = body;

    if (!nom || !situacio || !millora || !puntFort || !nivell || !destinatari || !tono) {
      return new Response(JSON.stringify({ error: "Falten camps obligatoris" }), {
        status: 400, headers: corsHeaders,
      });
    }

    if (!env.GROQ_API_KEY) {
      return new Response(JSON.stringify({ error: "API key no configurada" }), {
        status: 500, headers: corsHeaders,
      });
    }

    const prompt = `Ets un expert en pedagogia i comunicació educativa. Genera feedback personalitzat per a un alumne/a en català.

Dades de l'alumne/a:
- Nom: ${nom}
- Situació actual: ${situacio}
- Àrea de millora principal: ${millora}
- Punt fort: ${puntFort}
- Nivell educatiu: ${nivell}
- Destinatari: ${destinatari}
- Tono: ${tono}

Genera 3 versions de feedback (curta, mitjana i llarga) adequades al destinatari "${destinatari}" amb un tono "${tono}". El feedback ha de ser constructiu, motivador i basat en els punts forts de l'alumne. Afegeix 3 suggeriments concrets de millora.

Respon ÚNICAMENT amb un JSON vàlid amb aquest format exacte, sense cap text addicional:
{
  "nom": "${nom}",
  "feedback_curt": "Feedback de ~50 paraules, directe i motivador",
  "feedback_mitja": "Feedback de ~100 paraules, amb context i orientació",
  "feedback_llarg": "Feedback de ~200 paraules, complet amb context, valoració i pla de millora",
  "suggeriments": ["Suggeriment concret 1", "Suggeriment concret 2", "Suggeriment concret 3"]
}`;

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        max_tokens: 2048,
        temperature: 0.4,
        messages: [
          { role: "system", content: "Ets un expert en pedagogia i comunicació educativa. Respon sempre amb JSON vàlid, sense markdown ni text addicional." },
          { role: "user", content: prompt }
        ],
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      return new Response(JSON.stringify({ error: "Error API: " + err }), {
        status: 500, headers: corsHeaders,
      });
    }

    const data = await response.json();
    const text = data.choices[0].message.content.trim();

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return new Response(JSON.stringify({ error: "Resposta invàlida de la IA" }), {
        status: 500, headers: corsHeaders,
      });
    }

    const result = JSON.parse(jsonMatch[0]);

    try { await env.DB.prepare("INSERT INTO estadistiques (eina,data,usos) VALUES ('feedback',date('now'),1) ON CONFLICT(eina,data) DO UPDATE SET usos=usos+1").run(); } catch {}

    return new Response(JSON.stringify({ result }), {
      status: 200,
      headers: { ...corsHeaders, "Cache-Control": "no-store" },
    });

  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500, headers: corsHeaders,
    });
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
