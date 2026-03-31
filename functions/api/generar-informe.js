export async function onRequestPost(context) {
  const { request, env } = context;

  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Content-Type": "application/json",
  };

  try {
    const body = await request.json();
    const { nom, trimestre, nivell, assignatura, nota, assoliment, observacions, llengua, ccaa = 'Catalunya' } = body;

    if (!nom || !trimestre || !nivell || !assignatura || !nota || !assoliment) {
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
      ? "Escriu l'informe completament en castellà."
      : "Escriu l'informe completament en català.";

    const observacionsStr = observacions && observacions.trim()
      ? `Observacions del docent: ${observacions}`
      : "Observacions: Sense observacions addicionals específiques.";

    const prompt = `Ets un docent expert en redacció d'informes d'avaluació trimestral a Espanya, seguint el marc LOMLOE. ${lleguaInstr}

Dades de l'alumne/a:
- Nom: ${nom}
- Nivell: ${nivell}
- Trimestre: ${trimestre}
- Assignatura principal: ${assignatura}
- Nota global: ${nota}
- Assoliment competencial general: ${assoliment}
- ${observacionsStr}

Genera un informe d'avaluació trimestral complet, professional i adequat per a famílies. L'informe ha de:
- Ser coherent amb la nota i l'assoliment indicats
- Incorporar les observacions del docent de manera natural
- Usar el nom de l'alumne/a
- Ser professional però accessible per a famílies sense formació pedagògica
- Tenir un to constructiu i orientat a la millora

Respon ÚNICAMENT amb un JSON vàlid amb aquest format exacte, sense cap text addicional:
{
  "valoracio_global": "Paràgraf de valoració global del trimestre (3-4 frases). Ha de reflectir la nota i l'assoliment competencial.",
  "competencies": "Paràgraf sobre les competències clau LOMLOE treballades durant el trimestre i el grau d'assoliment de l'alumne/a en cadascuna (3-5 frases).",
  "evolucio": "Paràgraf sobre l'evolució de l'alumne/a al llarg del trimestre: progrés observat, canvis d'actitud, millores destacables (2-3 frases).",
  "reforcar": "Paràgraf sobre els aspectes que l'alumne/a ha de reforçar o millorar de cara al proper trimestre (2-3 frases). Ton constructiu, no punitiu.",
  "orientacions_families": "Paràgraf amb orientacions concretes i pràctiques per a les famílies sobre com acompanyar l'alumne/a en el seu aprenentatge des de casa (3-4 frases)."
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

    try { await env.DB.prepare("INSERT INTO estadistiques (eina,data,usos) VALUES ('informes',date('now'),1) ON CONFLICT(eina,data) DO UPDATE SET usos=usos+1").run(); } catch {}

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

