export async function onRequestPost(context) {
  const { request, env } = context;

  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Content-Type": "application/json",
  };

  try {
    const body = await request.json();
    const { activitat, nivell, necessitat, grau, ccaa = 'Catalunya' } = body;

    if (!activitat || !nivell || !necessitat) {
      return new Response(JSON.stringify({ error: "Falten camps obligatoris" }), {
        status: 400, headers: corsHeaders,
      });
    }

    if (!env.GROQ_API_KEY) {
      return new Response(JSON.stringify({ error: "API key no configurada" }), {
        status: 500, headers: corsHeaders,
      });
    }

    const grauDesc = grau === "significativa"
      ? "Adaptació significativa: modifica els objectius si cal, simplifica continguts, prioritza competències essencials"
      : "Adaptació lleugera: manté els mateixos objectius però adapta el format, el suport i la presentació";

    const prompt = `Ets un especialista en educació inclusiva i adaptacions curriculars a Espanya (LOMLOE). Treballa amb el sistema d'atenció a la diversitat vigent.

Activitat original a adaptar:
${activitat}

Dades:
- Nivell educatiu: ${nivell}
- Tipus de necessitat educativa especial: ${necessitat}
- Tipus d'adaptació: ${grauDesc}

Genera una adaptació curricular completa i pràctica en català. L'adaptació ha de ser realista, aplicable a l'aula i basada en evidències pedagògiques reconegudes per a aquesta NEE.

Respon ÚNICAMENT amb un JSON vàlid amb aquest format exacte, sense cap text addicional:
{
  "activitat_adaptada": "Versió completa i adaptada de l'activitat, reescrita amb tots els canvis necessaris per a l'alumne amb ${necessitat}. Ha de ser clara, concreta i directament usable pel docent.",
  "orientacions": [
    "Orientació pràctica 1 per al docent sobre com aplicar l'adaptació",
    "Orientació pràctica 2",
    "Orientació pràctica 3",
    "Orientació pràctica 4",
    "Orientació pràctica 5"
  ],
  "materials": [
    "Material o recurs concret suggerit 1",
    "Material o recurs concret suggerit 2",
    "Material o recurs concret suggerit 3",
    "Material o recurs concret suggerit 4"
  ]
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
        temperature: 0.3,
        messages: [
          { role: "system", content: "Ets un expert en educació LOMLOE. Respon sempre amb JSON vàlid, sense markdown ni text addicional." },
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

    try { await env.DB.prepare("INSERT INTO estadistiques (eina,data,usos) VALUES ('adaptacions',date('now'),1) ON CONFLICT(eina,data) DO UPDATE SET usos=usos+1").run(); } catch {}

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

