export async function onRequestPost(context) {
  const { request, env } = context;

  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Content-Type": "application/json",
  };

  try {
    const body = await request.json();
    const { assignatura, nivell, continguts, trimestres, sessionsSetmana } = body;

    if (!assignatura || !nivell || !continguts || !trimestres || !sessionsSetmana) {
      return new Response(JSON.stringify({ error: "Falten camps obligatoris" }), {
        status: 400, headers: corsHeaders,
      });
    }

    if (!env.GROQ_API_KEY) {
      return new Response(JSON.stringify({ error: "API key no configurada" }), {
        status: 500, headers: corsHeaders,
      });
    }

    const prompt = `Ets un expert en programació didàctica i currículum LOMLOE. Genera una seqüència de continguts en català.

Dades:
- Assignatura: ${assignatura}
- Nivell educatiu: ${nivell}
- Nombre de trimestres: ${trimestres}
- Sessions per setmana: ${sessionsSetmana}
- Continguts a distribuir: ${continguts}

Calcula les sessions totals per trimestre assumint ~12 setmanes per trimestre (descomptant festius i exàmens). Distribueix els continguts de manera equilibrada i progressiva entre els trimestres. Els primers trimestres han de tenir continguts fonamentals i els darrers continguts d'aprofundiment i integració.

Respon ÚNICAMENT amb un JSON vàlid amb aquest format exacte, sense cap text addicional:
{
  "assignatura": "${assignatura}",
  "trimestres": [
    {
      "num": 1,
      "nom": "Primer Trimestre",
      "sessions_total": 24,
      "continguts": [
        {
          "tema": "Nom del tema",
          "sessions": 6,
          "descripcio": "Breu descripció dels continguts i l'enfocament didàctic"
        }
      ],
      "observacions": "Notes generals sobre el trimestre, connexions entre temes, activitats especials"
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
          { role: "system", content: "Ets un expert en programació didàctica i currículum LOMLOE. Respon sempre amb JSON vàlid, sense markdown ni text addicional." },
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

    try { await env.DB.prepare("INSERT INTO estadistiques (eina,data,usos) VALUES ('sequenciador',date('now'),1) ON CONFLICT(eina,data) DO UPDATE SET usos=usos+1").run(); } catch {}

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
