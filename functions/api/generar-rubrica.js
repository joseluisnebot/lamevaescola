export async function onRequestPost(context) {
  const { request, env } = context;

  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Content-Type": "application/json",
  };

  try {
    const body = await request.json();
    const { assignatura, nivell, competencia, criteri, ccaa = "Catalunya" } = body;

    if (!assignatura || !nivell || !competencia || !criteri) {
      return new Response(JSON.stringify({ error: "Falten camps obligatoris" }), {
        status: 400, headers: corsHeaders,
      });
    }

    if (!env.GROQ_API_KEY) {
      return new Response(JSON.stringify({ error: "API key no configurada" }), {
        status: 500, headers: corsHeaders,
      });
    }

    const prompt = `Ets un expert en educació espanyola i en la llei LOMLOE i el currículum de ${ccaa}. Genera una rúbrica d'avaluació detallada en català, adaptada a la normativa de ${ccaa}.

Dades:
- Assignatura: ${assignatura}
- Nivell educatiu: ${nivell}
- Competència clau LOMLOE: ${competencia}
- Criteri d'avaluació: ${criteri}

Genera una rúbrica amb exactament 4 nivells d'assoliment i entre 3 i 5 indicadors rellevants per al criteri donat.

Respon ÚNICAMENT amb un JSON vàlid amb aquest format exacte, sense cap text addicional:
{
  "titol": "Títol descriptiu de la rúbrica",
  "indicadors": [
    {
      "nom": "Nom de l'indicador",
      "nivells": {
        "iniciacio": "Descripció de l'alumne en nivell iniciació (1-4)",
        "proces": "Descripció de l'alumne en procés (5-6)",
        "assoliment": "Descripció de l'alumne amb assoliment satisfactori (7-8)",
        "excelent": "Descripció de l'alumne amb assoliment excel·lent (9-10)"
      }
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

    const rubrica = JSON.parse(jsonMatch[0]);

    try { await env.DB.prepare("INSERT INTO estadistiques (eina,data,usos) VALUES ('rubriques',date('now'),1) ON CONFLICT(eina,data) DO UPDATE SET usos=usos+1").run(); } catch {}

    return new Response(JSON.stringify({ rubrica }), {
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
