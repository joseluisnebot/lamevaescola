export async function onRequestPost(context) {
  const { request, env } = context;
  const corsHeaders = { "Access-Control-Allow-Origin": "*", "Content-Type": "application/json" };

  try {
    const body = await request.json();
    const { titol, assignatura, nivell, sessions, trimestre, competencies, ccaa = 'Catalunya' } = body;

    if (!titol || !assignatura || !nivell || !sessions) {
      return new Response(JSON.stringify({ error: "Falten camps obligatoris" }), { status: 400, headers: corsHeaders });
    }
    if (!env.GROQ_API_KEY) {
      return new Response(JSON.stringify({ error: "API key no configurada" }), { status: 500, headers: corsHeaders });
    }

    const competenciesStr = competencies && competencies.length > 0
      ? competencies.join(", ")
      : "CCL, STEM, CPSAA (les més adequades)";

    const prompt = `Ets un expert en didàctica i en la llei LOMLOE i el currículum de ${ccaa}. Genera una programació d'unitat didàctica completa en català.

Dades:
- Títol de la unitat: ${titol}
- Assignatura: ${assignatura}
- Nivell educatiu: ${nivell}
- Nombre de sessions: ${sessions}
- Trimestre: ${trimestre || '1r trimestre'}
- Competències clau: ${competenciesStr}

Genera una programació realista, estructurada i alineada amb LOMLOE.

Respon ÚNICAMENT amb un JSON vàlid amb aquest format exacte, sense cap text addicional:
{
  "titol": "Títol definitiu de la unitat",
  "justificacio": "Justificació curricular i context (2-3 frases)",
  "objectius": ["Objectiu 1", "Objectiu 2", "Objectiu 3"],
  "continguts": ["Contingut 1", "Contingut 2", "Contingut 3", "Contingut 4"],
  "competencies": ["CCL", "STEM"],
  "sessions": [
    {
      "num": 1,
      "titol": "Títol de la sessió",
      "descripcio": "Què es treballa i com (2-3 frases)",
      "activitat_principal": "Nom breu de l'activitat principal",
      "agrupament": "Gran grup / Parelles / Individual",
      "recursos": "Recursos necessaris"
    }
  ],
  "avaluacio": "Descripció dels instruments d'avaluació",
  "atencio_diversitat": "Mesures d'atenció a la diversitat previstes"
}`;

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${env.GROQ_API_KEY}` },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile", max_tokens: 3000, temperature: 0.35,
        messages: [
          { role: "system", content: "Ets un expert en educació LOMLOE. Respon sempre amb JSON vàlid, sense markdown ni text addicional." },
          { role: "user", content: prompt }
        ],
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      return new Response(JSON.stringify({ error: "Error API: " + err }), { status: 500, headers: corsHeaders });
    }

    const data = await response.json();
    const text = data.choices[0].message.content.trim();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return new Response(JSON.stringify({ error: "Resposta invàlida de la IA" }), { status: 500, headers: corsHeaders });

    const result = JSON.parse(jsonMatch[0]);
    try { await env.DB.prepare("INSERT INTO estadistiques (eina,data,usos) VALUES ('programacio',date('now'),1) ON CONFLICT(eina,data) DO UPDATE SET usos=usos+1").run(); } catch {}

    return new Response(JSON.stringify({ result }), { status: 200, headers: { ...corsHeaders, "Cache-Control": "no-store" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: corsHeaders });
  }
}

export async function onRequestOptions() {
  return new Response(null, { headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type" } });
}
