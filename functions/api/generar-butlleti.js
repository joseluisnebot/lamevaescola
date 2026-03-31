export async function onRequestPost(context) {
  const { request, env } = context;

  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Content-Type": "application/json",
  };

  try {
    const body = await request.json();
    const { nom, nivell, assignatura, nota, punts_forts, millorar, llengua, ccaa = 'Catalunya' } = body;

    if (!nom || !nivell || !assignatura || !nota || !punts_forts) {
      return new Response(JSON.stringify({ error: "Falten camps obligatoris" }), {
        status: 400, headers: corsHeaders,
      });
    }

    if (!env.GROQ_API_KEY) {
      return new Response(JSON.stringify({ error: "API key no configurada" }), {
        status: 500, headers: corsHeaders,
      });
    }

    const lleguaInstr = llengua === "castella"
      ? "Escriu els comentaris en castellà."
      : "Escriu els comentaris en català.";

    const millorarStr = millorar && millorar.trim()
      ? `- Aspectes a millorar: ${millorar}`
      : "- Aspectes a millorar: No s'especifiquen aspectes concrets a millorar";

    const prompt = `Ets un docent expert en redacció de comentaris per a butlletins de notes escolars a Espanya (sistema LOMLOE). ${lleguaInstr}

Dades de l'alumne/a:
- Nom: ${nom}
- Curs/Nivell: ${nivell}
- Assignatura: ${assignatura}
- Nota global: ${nota}
- Punts forts: ${punts_forts}
${millorarStr}

Genera tres versions del comentari per al butlletí: una curta (~50 paraules), una de mitjana (~100 paraules) i una de llarga (~150 paraules). Els comentaris han de ser:
- Personalitzats i específics (usar el nom de l'alumne/a)
- Positius però honestos
- Professionals i adequats per a famílies
- Coherents amb la nota i els punts descrits
- En llengua formal però accessible

Respon ÚNICAMENT amb un JSON vàlid amb aquest format exacte, sense cap text addicional:
{
  "curt": "Comentari curt d'aproximadament 50 paraules",
  "mitja": "Comentari mitjà d'aproximadament 100 paraules",
  "llarg": "Comentari llarg d'aproximadament 150 paraules"
}`;

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        max_tokens: 1024,
        temperature: 0.4,
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

    try { await env.DB.prepare("INSERT INTO estadistiques (eina,data,usos) VALUES ('butlletins',date('now'),1) ON CONFLICT(eina,data) DO UPDATE SET usos=usos+1").run(); } catch {}

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

