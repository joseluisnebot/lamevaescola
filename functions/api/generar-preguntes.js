export async function onRequestPost(context) {
  const { request, env } = context;
  const corsHeaders = { "Access-Control-Allow-Origin": "*", "Content-Type": "application/json" };

  try {
    const body = await request.json();
    const { tema, assignatura, nivell, tipus, nombre = 10, ccaa = 'Catalunya' } = body;

    if (!tema || !assignatura || !nivell) {
      return new Response(JSON.stringify({ error: "Falten camps obligatoris" }), { status: 400, headers: corsHeaders });
    }
    if (!env.GROQ_API_KEY) {
      return new Response(JSON.stringify({ error: "API key no configurada" }), { status: 500, headers: corsHeaders });
    }

    const tipusStr = tipus && tipus !== 'Mixt' ? `Tipus de preguntes: ${tipus}.` : 'Combina preguntes de diferent tipus: definició, comprensió, aplicació i anàlisi.';

    const prompt = `Ets un expert en educació i avaluació LOMLOE del currículum de ${ccaa}. Genera preguntes d'examen en català.

Dades:
- Tema: ${tema}
- Assignatura: ${assignatura}
- Nivell educatiu: ${nivell}
- ${tipusStr}
- Nombre de preguntes: ${nombre}

Genera exactament ${nombre} preguntes variades i adequades al nivell, amb la resposta correcta per a cada una.

Respon ÚNICAMENT amb un JSON vàlid amb aquest format exacte, sense cap text addicional:
{
  "tema": "${tema}",
  "preguntes": [
    {
      "num": 1,
      "tipus": "Definició / Comprensió / Aplicació / Anàlisi / Veritat o fals / Completar",
      "pregunta": "Text de la pregunta",
      "resposta": "Resposta correcta o orientació per al docent"
    }
  ]
}`;

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${env.GROQ_API_KEY}` },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile", max_tokens: 3000, temperature: 0.4,
        messages: [
          { role: "system", content: "Ets un expert en educació LOMLOE. Respon sempre amb JSON vàlid, sense markdown ni text addicional." },
          { role: "user", content: prompt }
        ],
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      return new Response(JSON.stringify({ error: "Error API: " + err }), { status: 500, headers: corsHeaders });
    }

    const data = await response.json();
    const text = data.choices[0].message.content.trim();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return new Response(JSON.stringify({ error: "Resposta invàlida de la IA" }), { status: 500, headers: corsHeaders });

    const result = JSON.parse(jsonMatch[0]);
    try { await env.DB.prepare("INSERT INTO estadistiques (eina,data,usos) VALUES ('preguntes',date('now'),1) ON CONFLICT(eina,data) DO UPDATE SET usos=usos+1").run(); } catch {}

    return new Response(JSON.stringify({ result }), { status: 200, headers: { ...corsHeaders, "Cache-Control": "no-store" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: corsHeaders });
  }
}

export async function onRequestOptions() {
  return new Response(null, { headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type" } });
}
