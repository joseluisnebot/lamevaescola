export async function onRequestPost(context) {
  const { request, env } = context;

  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Content-Type": "application/json",
  };

  try {
    const body = await request.json();
    const { text, destinacio, longitud, registre } = body;

    if (!text || !destinacio) {
      return new Response(JSON.stringify({ error: "Falten camps obligatoris" }), {
        status: 400, headers: corsHeaders,
      });
    }

    if (!env.GROQ_API_KEY) {
      return new Response(JSON.stringify({ error: "API key no configurada" }), {
        status: 500, headers: corsHeaders,
      });
    }

    const longitudDesc = {
      'Breu (1-2 frases)': '1-2 frases concises',
      'Mitjana (1 paràgraf)': 'un paràgraf complet (4-6 frases)',
      'Extensa (2-3 paràgrafs)': '2-3 paràgrafs ben desenvolupats'
    }[longitud] || '1 paràgraf';

    const registreDesc = {
      'Formal institucional': 'formal institucional, seguint convencions de documents oficials educatius',
      'Formal proper': 'formal però proper, adequat per comunicar-se amb famílies',
      'Tècnic educatiu': 'tècnic educatiu, usant terminologia pedagògica i curricular específica'
    }[registre] || 'formal';

    const prompt = `Ets un expert en llengua catalana i en redacció de documents educatius formals. La teva tasca és transformar notes informals de docents en text professional en català formal.

Text original (notes informals del docent):
"${text}"

Destinació del text: ${destinacio}
Longitud desitjada: ${longitudDesc}
Registre: ${registreDesc}

Transforma el text a català formal i professional, adequat per a ${destinacio}. Mantén el contingut essencial però millora el vocabulari, l'estructura i el to.

Respon ÚNICAMENT amb un JSON vàlid amb aquest format exacte, sense cap text addicional:
{
  "versio_principal": "Primera versió formal del text transformat",
  "versio_alternativa": "Segona versió amb formulació alternativa, diferent però igual de vàlida",
  "millores_detectades": ["Millora 1 aplicada al text", "Millora 2 aplicada", "Millora 3 aplicada"],
  "paraules_clau": ["terme educatiu 1", "terme educatiu 2", "terme educatiu 3"]
}`;

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        max_tokens: 1500,
        temperature: 0.4,
        messages: [
          { role: "system", content: "Ets un expert en llengua catalana i redacció educativa formal. Respon sempre amb JSON vàlid, sense markdown ni text addicional." },
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
    const rawText = data.choices[0].message.content.trim();

    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return new Response(JSON.stringify({ error: "Resposta invàlida de la IA" }), {
        status: 500, headers: corsHeaders,
      });
    }

    const result = JSON.parse(jsonMatch[0]);

    try { await env.DB.prepare("INSERT INTO estadistiques (eina,data,usos) VALUES ('traductor',date('now'),1) ON CONFLICT(eina,data) DO UPDATE SET usos=usos+1").run(); } catch {}

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
