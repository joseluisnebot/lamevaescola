export async function onRequestPost(context) {
  const { request, env } = context;

  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Content-Type": "application/json",
  };

  try {
    const body = await request.json();
    const { tema, assignatura, nivell, nombre } = body;

    if (!tema || !assignatura || !nivell || !nombre) {
      return new Response(JSON.stringify({ error: "Falten camps obligatoris" }), {
        status: 400, headers: corsHeaders,
      });
    }

    if (!env.GROQ_API_KEY) {
      return new Response(JSON.stringify({ error: "API key no configurada" }), {
        status: 500, headers: corsHeaders,
      });
    }

    const prompt = `Ets un expert en educació espanyola, en la taxonomia de Bloom i en el currículum LOMLOE. Genera objectius d'aprenentatge en català.

Dades:
- Tema / Contingut: ${tema}
- Assignatura: ${assignatura}
- Nivell educatiu: ${nivell}
- Nombre d'objectius: ${nombre}

Genera ${nombre} objectius d'aprenentatge concrets, mesurables i alineats amb el currículum LOMLOE. Cada objectiu ha de tenir un verb de la taxonomia de Bloom, el nivell cognitiu corresponent i 2-3 indicadors d'assoliment.

Respon ÚNICAMENT amb un JSON vàlid amb aquest format exacte, sense cap text addicional:
{
  "objectius": [
    {
      "objectiu": "Text complet de l'objectiu d'aprenentatge",
      "verb_bloom": "Verb d'acció (ex: Identificar, Analitzar, Crear...)",
      "nivell_bloom": "Recordar | Comprendre | Aplicar | Analitzar | Avaluar | Crear",
      "indicadors": ["Indicador 1", "Indicador 2", "Indicador 3"]
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
          { role: "system", content: "Ets un expert en educació LOMLOE i taxonomia de Bloom. Respon sempre amb JSON vàlid, sense markdown ni text addicional." },
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

    try { await env.DB.prepare("INSERT INTO estadistiques (eina,data,usos) VALUES ('objectius',date('now'),1) ON CONFLICT(eina,data) DO UPDATE SET usos=usos+1").run(); } catch {}

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
