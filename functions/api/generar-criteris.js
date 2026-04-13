export async function onRequestPost(context) {
  const { request, env } = context;

  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Content-Type": "application/json",
  };

  try {
    const body = await request.json();
    const { assignatura, nivell, competencia, nombre, trimestre } = body;

    if (!assignatura || !nivell || !competencia) {
      return new Response(JSON.stringify({ error: "Falten camps obligatoris" }), {
        status: 400, headers: corsHeaders,
      });
    }

    if (!env.GROQ_API_KEY) {
      return new Response(JSON.stringify({ error: "API key no configurada" }), {
        status: 500, headers: corsHeaders,
      });
    }

    const nombreCriteris = parseInt(nombre) || 4;

    const prompt = `Ets un expert en avaluació educativa i en el Decret 175/2022 del currículum de Catalunya (primària i ESO). Genera criteris d'avaluació en català.

Dades:
- Assignatura: ${assignatura}
- Nivell: ${nivell}
- Competència específica a avaluar: ${competencia}
- Nombre de criteris a generar: ${nombreCriteris}
- Trimestre: ${trimestre || 'Tot el curs'}

Genera exactament ${nombreCriteris} criteris d'avaluació alineats amb el Decret 175/2022, adequats per al nivell indicat i per a la competència específica descrita. Cada criteri ha d'incloure indicadors observables, un instrument d'avaluació suggerit i les descripcions dels 4 nivells d'assoliment (NA, AS, AN, AE) tal com estableix el currículum català.

Respon ÚNICAMENT amb un JSON vàlid amb aquest format exacte, sense cap text addicional:
{
  "competencia": "Descripció formal de la competència específica treballada",
  "criteris": [
    {
      "num": 1,
      "criteri": "Text complet del criteri d'avaluació",
      "indicadors": ["Indicador observable 1", "Indicador observable 2", "Indicador observable 3"],
      "instrument": "Instrument d'avaluació suggerit",
      "nivells": {
        "NA": "Descripció del No Assolit: el que l'alumne no aconsegueix",
        "AS": "Descripció de l'Assolit Suficient: el mínim esperat",
        "AN": "Descripció de l'Assolit Notable: bon domini",
        "AE": "Descripció de l'Assolit Excel·lent: domini superior"
      }
    }
  ]
}

Genera exactament ${nombreCriteris} criteris en l'array "criteris".`;

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        max_tokens: 3000,
        temperature: 0.2,
        messages: [
          { role: "system", content: "Ets un expert en avaluació educativa i el Decret 175/2022 de Catalunya. Respon sempre amb JSON vàlid, sense markdown ni text addicional." },
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

    try { await env.DB.prepare("INSERT INTO estadistiques (eina,data,usos) VALUES ('criteris',date('now'),1) ON CONFLICT(eina,data) DO UPDATE SET usos=usos+1").run(); } catch {}

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
