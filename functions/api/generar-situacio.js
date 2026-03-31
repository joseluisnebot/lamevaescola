export async function onRequestPost(context) {
  const { request, env } = context;

  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Content-Type": "application/json",
  };

  try {
    const body = await request.json();
    const { titol, assignatura, nivell, duracio, competencies, ccaa = 'Catalunya' } = body;

    if (!titol || !assignatura || !nivell || !duracio) {
      return new Response(JSON.stringify({ error: "Falten camps obligatoris" }), {
        status: 400, headers: corsHeaders,
      });
    }

    if (!env.GROQ_API_KEY) {
      return new Response(JSON.stringify({ error: "API key no configurada" }), {
        status: 500, headers: corsHeaders,
      });
    }

    const competenciesStr = competencies && competencies.length > 0
      ? competencies.join(", ")
      : "CCL, CPSAA (escull les més adequades)";

    const prompt = `Ets un expert en educació espanyola i en la llei LOMLOE i el currículum de ${ccaa}. Genera una situació d'aprenentatge completa en català.

Dades:
- Títol / Tema: ${titol}
- Assignatura o àrea: ${assignatura}
- Nivell educatiu: ${nivell}
- Durada estimada: ${duracio}
- Competències clau a treballar: ${competenciesStr}

Genera una situació d'aprenentatge completa i realista per a un docent de Catalunya/Espanya, seguint el format LOMLOE.

Respon ÚNICAMENT amb un JSON vàlid amb aquest format exacte, sense cap text addicional:
{
  "titol": "Títol definitiu de la situació d'aprenentatge",
  "contextualitzacio": "Paràgraf explicant el context, la motivació i la relació amb el currículum",
  "producte_final": "Descripció breu del producte final que elaboraran els alumnes",
  "activitats": [
    {
      "num": 1,
      "nom": "Nom de l'activitat",
      "descripcio": "Descripció de l'activitat (2-3 frases)",
      "duracio": "Temps estimat",
      "agrupament": "Individual / Parelles / Grup petit / Gran grup"
    },
    {
      "num": 2,
      "nom": "Nom de l'activitat",
      "descripcio": "Descripció de l'activitat",
      "duracio": "Temps estimat",
      "agrupament": "Individual / Parelles / Grup petit / Gran grup"
    },
    {
      "num": 3,
      "nom": "Nom de l'activitat",
      "descripcio": "Descripció de l'activitat",
      "duracio": "Temps estimat",
      "agrupament": "Individual / Parelles / Grup petit / Gran grup"
    },
    {
      "num": 4,
      "nom": "Nom de l'activitat",
      "descripcio": "Descripció de l'activitat",
      "duracio": "Temps estimat",
      "agrupament": "Individual / Parelles / Grup petit / Gran grup"
    },
    {
      "num": 5,
      "nom": "Nom de l'activitat",
      "descripcio": "Descripció de l'activitat",
      "duracio": "Temps estimat",
      "agrupament": "Individual / Parelles / Grup petit / Gran grup"
    }
  ],
  "competencies": ["CCL", "CPSAA"],
  "criteris": [
    "Criteri d'avaluació 1 relacionat amb la situació",
    "Criteri d'avaluació 2",
    "Criteri d'avaluació 3"
  ],
  "avaluacio": "Descripció dels instruments i estratègies d'avaluació que s'usaran"
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

    try { await env.DB.prepare("INSERT INTO estadistiques (eina,data,usos) VALUES ('situacions',date('now'),1) ON CONFLICT(eina,data) DO UPDATE SET usos=usos+1").run(); } catch {}

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
