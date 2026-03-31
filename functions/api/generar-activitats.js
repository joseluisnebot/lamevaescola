export async function onRequestPost(context) {
  const { request, env } = context;

  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Content-Type": "application/json",
  };

  try {
    const body = await request.json();
    const { tema, assignatura, nivell, tipus, duracio, ccaa = 'Catalunya' } = body;

    if (!tema || !assignatura || !nivell || !duracio) {
      return new Response(JSON.stringify({ error: "Falten camps obligatoris" }), {
        status: 400, headers: corsHeaders,
      });
    }

    if (!env.GROQ_API_KEY) {
      return new Response(JSON.stringify({ error: "API key no configurada" }), {
        status: 500, headers: corsHeaders,
      });
    }

    const tipusStr = tipus && tipus !== "Qualsevol"
      ? `Preferència pel tipus: ${tipus}. Intenta que la majoria d'activitats siguin d'aquest tipus o similars.`
      : "Varia els tipus d'activitats: combina pràctica, digital, cooperativa i creativa.";

    const prompt = `Ets un docent expert i pedagog especialitzat en metodologies actives i la llei LOMLOE i el currículum de ${ccaa}. Genera activitats enginyoses i motivadores en català.

Dades:
- Tema o contingut: ${tema}
- Assignatura: ${assignatura}
- Nivell educatiu: ${nivell}
- Durada per activitat: ${duracio}
- ${tipusStr}

Genera exactament 5 activitats creatives, variades i adequades per al nivell. Cada activitat ha de ser diferent i original. Indica les competències clau LOMLOE (CCL, CP, STEM, CD, CPSAA, CC, CE, CCEC) que treballa cadascuna.

Respon ÚNICAMENT amb un JSON vàlid amb aquest format exacte, sense cap text addicional:
{
  "activitats": [
    {
      "num": 1,
      "nom": "Nom creatiu de l'activitat",
      "descripcio": "Descripció detallada de l'activitat en 2-3 frases. Explica clarament què faran els alumnes i com.",
      "duracio": "${duracio}",
      "agrupament": "Individual / Parelles / Grup de 4 / Gran grup",
      "materials": "Llista breu dels materials necessaris",
      "competencies": "CCL, CPSAA"
    },
    {
      "num": 2,
      "nom": "Nom creatiu de l'activitat",
      "descripcio": "Descripció de l'activitat",
      "duracio": "${duracio}",
      "agrupament": "Individual / Parelles / Grup de 4 / Gran grup",
      "materials": "Materials necessaris",
      "competencies": "STEM, CD"
    },
    {
      "num": 3,
      "nom": "Nom creatiu de l'activitat",
      "descripcio": "Descripció de l'activitat",
      "duracio": "${duracio}",
      "agrupament": "Individual / Parelles / Grup de 4 / Gran grup",
      "materials": "Materials necessaris",
      "competencies": "CCL, CC"
    },
    {
      "num": 4,
      "nom": "Nom creatiu de l'activitat",
      "descripcio": "Descripció de l'activitat",
      "duracio": "${duracio}",
      "agrupament": "Individual / Parelles / Grup de 4 / Gran grup",
      "materials": "Materials necessaris",
      "competencies": "CCEC, CE"
    },
    {
      "num": 5,
      "nom": "Nom creatiu de l'activitat",
      "descripcio": "Descripció de l'activitat",
      "duracio": "${duracio}",
      "agrupament": "Individual / Parelles / Grup de 4 / Gran grup",
      "materials": "Materials necessaris",
      "competencies": "CPSAA, CD"
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
        temperature: 0.5,
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

    try { await env.DB.prepare("INSERT INTO estadistiques (eina,data,usos) VALUES ('activitats',date('now'),1) ON CONFLICT(eina,data) DO UPDATE SET usos=usos+1").run(); } catch {}

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

