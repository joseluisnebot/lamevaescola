export async function onRequestPost(context) {
  const { request, env } = context;

  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Content-Type": "application/json",
  };

  try {
    const body = await request.json();
    const { motiu, detalls, curs, centre, data, tono } = body;

    if (!motiu || !detalls) {
      return new Response(JSON.stringify({ error: "Falten camps obligatoris" }), {
        status: 400, headers: corsHeaders,
      });
    }

    if (!env.GROQ_API_KEY) {
      return new Response(JSON.stringify({ error: "API key no configurada" }), {
        status: 500, headers: corsHeaders,
      });
    }

    const tonoDesc = {
      'Formal': 'molt formal i institucional, distant però respectuós',
      'Proper': 'formal però proper i càlid, proper a les famílies',
      'Informatiu': 'clar, directe i informatiu, sense excessiva formalitat'
    }[tono] || 'formal';

    const prompt = `Ets un expert en comunicació educativa institucional de Catalunya. Genera un comunicat oficial per a famílies en català.

Dades del comunicat:
- Motiu: ${motiu}
- Detalls específics: ${detalls}
${curs ? `- Curs o grup: ${curs}` : ''}
${centre ? `- Nom del centre: ${centre}` : ''}
${data ? `- Data: ${data}` : ''}
- To: ${tonoDesc}

Genera un comunicat oficial complet, professional i ben redactat que el centre pot enviar a les famílies. El comunicat ha d'estar en català formal correcte, ben estructurat i amb tots els elements d'un comunicat institucional.

Respon ÚNICAMENT amb un JSON vàlid amb aquest format exacte, sense cap text addicional:
{
  "assumpte": "Línia d'assumpte breu i clara per a l'email o sobre",
  "cos": "Cos complet del comunicat amb salutació inicial, desenvolupament en 2-3 paràgrafs i conclusió. Separa els paràgrafs amb \\n\\n",
  "comiat": "Fórmula de comiat formal",
  "notes_addicionals": "Nota opcional per al docent sobre com personalitzar o quan enviar (o cadena buida si no cal)"
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
          { role: "system", content: "Ets un expert en comunicació educativa institucional. Respon sempre amb JSON vàlid, sense markdown ni text addicional." },
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

    const data2 = await response.json();
    const text = data2.choices[0].message.content.trim();

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return new Response(JSON.stringify({ error: "Resposta invàlida de la IA" }), {
        status: 500, headers: corsHeaders,
      });
    }

    const result = JSON.parse(jsonMatch[0]);

    try { await env.DB.prepare("INSERT INTO estadistiques (eina,data,usos) VALUES ('comunicats',date('now'),1) ON CONFLICT(eina,data) DO UPDATE SET usos=usos+1").run(); } catch {}

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
