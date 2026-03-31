export async function onRequestPost(context) {
  const { request, env } = context;
  const corsHeaders = { "Access-Control-Allow-Origin": "*", "Content-Type": "application/json" };

  try {
    const body = await request.json();
    const { text, nivell, objectiu = 'simplificar', ccaa = 'Catalunya' } = body;

    if (!text || !nivell) {
      return new Response(JSON.stringify({ error: "Falten camps obligatoris" }), { status: 400, headers: corsHeaders });
    }
    if (!env.GROQ_API_KEY) {
      return new Response(JSON.stringify({ error: "API key no configurada" }), { status: 500, headers: corsHeaders });
    }

    const objectiuStr = {
      simplificar: 'Simplifica el text per fer-lo accessible al nivell indicat. Usa vocabulari senzill, frases curtes i estructura clara.',
      ampliar: 'Amplia i enriqueix el text per al nivell indicat. Afegeix vocabulari més complex, estructures avançades i detalls.',
      adaptar_tdah: 'Adapta el text per a alumnes amb TDAH: frases molt curtes, paràgrafs petits, idees clau destacades, llenguatge directe.',
      adaptar_dislexia: 'Adapta el text per a alumnes amb dislèxia: frases simples, paraules familiars, estructura molt clara, evita confusions.',
    }[objectiu] || 'Simplifica el text per fer-lo accessible al nivell indicat.';

    const prompt = `Ets un expert en lingüística i educació especialitzat en adaptació de textos per al currículum de ${ccaa}. Adapta el text en català.

Text original:
"""
${text.slice(0, 2000)}
"""

Nivell destinatari: ${nivell}
Objectiu: ${objectiuStr}

Mantén el contingut i les idees principals. El text adaptat ha de ser en català.

Respon ÚNICAMENT amb un JSON vàlid amb aquest format exacte, sense cap text addicional:
{
  "text_adaptat": "El text adaptat complet",
  "canvis": "Breu explicació dels principals canvis realitzats (1-2 frases)",
  "nivell_lexic": "Vocabulari bàsic / Estàndard / Avançat",
  "paraules_clau": ["paraula1", "paraula2", "paraula3"]
}`;

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${env.GROQ_API_KEY}` },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile", max_tokens: 2048, temperature: 0.3,
        messages: [
          { role: "system", content: "Ets un expert en educació. Respon sempre amb JSON vàlid, sense markdown ni text addicional." },
          { role: "user", content: prompt }
        ],
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      return new Response(JSON.stringify({ error: "Error API: " + err }), { status: 500, headers: corsHeaders });
    }

    const data = await response.json();
    const textResp = data.choices[0].message.content.trim();
    const jsonMatch = textResp.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return new Response(JSON.stringify({ error: "Resposta invàlida de la IA" }), { status: 500, headers: corsHeaders });

    const result = JSON.parse(jsonMatch[0]);
    try { await env.DB.prepare("INSERT INTO estadistiques (eina,data,usos) VALUES ('simplificador',date('now'),1) ON CONFLICT(eina,data) DO UPDATE SET usos=usos+1").run(); } catch {}

    return new Response(JSON.stringify({ result }), { status: 200, headers: { ...corsHeaders, "Cache-Control": "no-store" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: corsHeaders });
  }
}

export async function onRequestOptions() {
  return new Response(null, { headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type" } });
}
