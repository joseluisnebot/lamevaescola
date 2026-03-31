export async function onRequestPost(context) {
  const { request, env } = context;
  const corsHeaders = { "Access-Control-Allow-Origin": "*", "Content-Type": "application/json" };

  try {
    const body = await request.json();
    const { escola, curs, assumpte, tipus, detalls, ccaa = 'Catalunya' } = body;

    if (!escola || !curs || !assumpte || !tipus) {
      return new Response(JSON.stringify({ error: "Falten camps obligatoris" }), { status: 400, headers: corsHeaders });
    }
    if (!env.GROQ_API_KEY) {
      return new Response(JSON.stringify({ error: "API key no configurada" }), { status: 500, headers: corsHeaders });
    }

    const tipusDesc = {
      excursio: 'Carta d\'autorització per a una excursió o sortida escolar',
      reunio: 'Convocatòria a reunió de pares i mares',
      inici_curs: 'Carta de benvinguda i presentació d\'inici de curs',
      incident: 'Comunicat sobre una incidència o situació especial',
      felicitacio: 'Felicitació o reconeixement als alumnes i famílies',
      informacio: 'Comunicació informativa general de l\'escola',
      peticio: 'Sol·licitud de material, col·laboració o documentació a les famílies',
    }[tipus] || tipus;

    const prompt = `Ets un docent expert en comunicació escolar del sistema educatiu de ${ccaa}. Redacta una carta formal per a famílies en català.

Dades:
- Escola: ${escola}
- Curs / Grup: ${curs}
- Tipus de carta: ${tipusDesc}
- Assumpte principal: ${assumpte}
${detalls ? `- Detalls addicionals: ${detalls}` : ''}

Redacta una carta professional, cordial i clara. Usa un to proper però formal, adequat a la comunicació escola-família.

Respon ÚNICAMENT amb un JSON vàlid amb aquest format exacte, sense cap text addicional:
{
  "assumpte": "Línia d'assumpte per al correu o carta",
  "cos": "Text complet de la carta, amb salutació, cos i comiat. Usa \\n per als salts de línia.",
  "nota_peu": "Nota o informació de contacte opcional al peu"
}`;

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${env.GROQ_API_KEY}` },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile", max_tokens: 1500, temperature: 0.4,
        messages: [
          { role: "system", content: "Ets un expert en comunicació escolar. Respon sempre amb JSON vàlid, sense markdown ni text addicional." },
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
    try { await env.DB.prepare("INSERT INTO estadistiques (eina,data,usos) VALUES ('cartes',date('now'),1) ON CONFLICT(eina,data) DO UPDATE SET usos=usos+1").run(); } catch {}

    return new Response(JSON.stringify({ result }), { status: 200, headers: { ...corsHeaders, "Cache-Control": "no-store" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: corsHeaders });
  }
}

export async function onRequestOptions() {
  return new Response(null, { headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type" } });
}
