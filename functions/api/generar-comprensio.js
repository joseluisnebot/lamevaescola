export async function onRequestPost(context) {
  const { request, env } = context;

  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Content-Type": "application/json",
  };

  try {
    const body = await request.json();
    const { text, nivell, tipus, nombre } = body;

    if (!text || !nivell || !nombre) {
      return new Response(JSON.stringify({ error: "Falten camps obligatoris" }), {
        status: 400, headers: corsHeaders,
      });
    }

    if (!env.GROQ_API_KEY) {
      return new Response(JSON.stringify({ error: "API key no configurada" }), {
        status: 500, headers: corsHeaders,
      });
    }

    const tipusStr = tipus && tipus.length > 0
      ? tipus.join(", ")
      : "Literals, Inferencials, Valoració crítica";

    const prompt = `Ets un expert en comprensió lectora i didàctica de la llengua. Genera preguntes de comprensió en català.

Dades:
- Nivell educatiu: ${nivell}
- Tipus de preguntes a generar: ${tipusStr}
- Nombre total de preguntes: ${nombre}

Text a treballar:
"""
${text}
"""

Genera ${nombre} preguntes de comprensió lectora sobre el text, adaptades al nivell ${nivell}. Distribueix les preguntes equitativament entre els tipus sol·licitats. Cada pregunta ha d'incloure la resposta correcta.

Respon ÚNICAMENT amb un JSON vàlid amb aquest format exacte, sense cap text addicional:
{
  "titol_text": "Títol curt extret o deduït del text",
  "preguntes": [
    {
      "num": 1,
      "tipus": "Literal | Inferencial | Valoració crítica | Vocabulari",
      "pregunta": "Text de la pregunta",
      "resposta": "Resposta correcta i completa"
    }
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
          { role: "system", content: "Ets un expert en comprensió lectora i didàctica. Respon sempre amb JSON vàlid, sense markdown ni text addicional." },
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
    const textRes = data.choices[0].message.content.trim();

    const jsonMatch = textRes.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return new Response(JSON.stringify({ error: "Resposta invàlida de la IA" }), {
        status: 500, headers: corsHeaders,
      });
    }

    const result = JSON.parse(jsonMatch[0]);

    try { await env.DB.prepare("INSERT INTO estadistiques (eina,data,usos) VALUES ('comprensio',date('now'),1) ON CONFLICT(eina,data) DO UPDATE SET usos=usos+1").run(); } catch {}

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
