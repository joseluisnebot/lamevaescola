export async function onRequestPost(context) {
  const { request, env } = context;

  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Content-Type": "application/json",
  };

  const BREVO_API_KEY = env.BREVO_API_KEY;

  try {
    const body = await request.json();
    const { email, name } = body;

    if (!email || !email.includes("@")) {
      return new Response(JSON.stringify({ error: "Email no vàlid" }), {
        status: 400, headers: corsHeaders,
      });
    }

    if (!BREVO_API_KEY) {
      return new Response(JSON.stringify({ error: "API key no configurada" }), {
        status: 500, headers: corsHeaders,
      });
    }

    const firstName = (name || "").trim().split(" ")[0] || "Docent";

    // 1. Add contact to Brevo list (list 3 = lamevaescola)
    await fetch("https://api.brevo.com/v3/contacts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": BREVO_API_KEY,
      },
      body: JSON.stringify({
        email,
        attributes: { FIRSTNAME: firstName },
        listIds: [3],
        updateEnabled: true,
      }),
    });

    // 2. Send welcome email with 15 prompts
    const emailHtml = `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>
body{font-family:Inter,Arial,sans-serif;background:#F7F9F7;margin:0;padding:0}
.wrap{max-width:600px;margin:0 auto;background:white;border-radius:12px;overflow:hidden}
.header{background:#2D6A4F;padding:2rem;text-align:center;color:white}
.header h1{font-size:1.4rem;margin:0;font-weight:800}
.header p{margin:0.5rem 0 0;opacity:0.85;font-size:0.9rem}
.body{padding:2rem}
.intro{font-size:1rem;color:#1A1917;line-height:1.7;margin-bottom:1.5rem}
.pc{background:#F0FAF4;border-left:4px solid #2D6A4F;border-radius:0 8px 8px 0;padding:1rem 1.25rem;margin-bottom:1rem}
.pn{font-size:0.7rem;font-weight:700;color:#2D6A4F;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:0.4rem}
.pt{font-size:0.83rem;color:#1B4332;line-height:1.6;background:rgba(0,0,0,0.04);padding:0.6rem;border-radius:4px;margin-top:0.4rem;font-family:monospace}
.cta{text-align:center;margin:2rem 0}
.btn{display:inline-block;background:#2D6A4F;color:white;padding:0.85rem 2rem;border-radius:8px;text-decoration:none;font-weight:700;font-size:0.95rem}
.footer{padding:1.5rem 2rem;border-top:1px solid #DDE8DD;font-size:0.75rem;color:#6B7B6B;text-align:center}
</style></head><body><div class="wrap">
<div class="header"><h1>Benvinguda/Benvingut a la Meva Escola 👩‍🏫</h1><p>Els teus 15 prompts per estalviar hores cada setmana</p></div>
<div class="body">
<p class="intro">Hola, ${firstName}!<br><br>Gràcies per unir-te a la comunitat de docents de <strong>la Meva Escola</strong>. Aquí tens els 15 prompts que més temps estalvien als mestres.</p>

<div class="pc"><div class="pn">Prompt 1 · Rúbriques</div>Crea una rúbrica d'avaluació LOMLOE<div class="pt">"Crea una rúbrica d'avaluació per a [assignatura] de [nivell] sobre el criteri: [criteri]. Inclou 4 nivells: Iniciació (1-4), En procés (5-6), Assoliment (7-8) i Excel·lent (9-10). Alinea-la amb la competència LOMLOE [competència]. Format: taula."</div></div>

<div class="pc"><div class="pn">Prompt 2 · Situació d'Aprenentatge</div>Genera una SA completa<div class="pt">"Dissenya una situació d'aprenentatge per a [nivell] sobre [tema]. Inclou: títol, contextualització, producte final, 4-5 activitats seqüenciades amb durada i agrupament, competències LOMLOE i criteris d'avaluació."</div></div>

<div class="pc"><div class="pn">Prompt 3 · Butlletí</div>Comentari trimestral personalitzat<div class="pt">"Escriu 3 versions d'un comentari de butlletí per a un alumne de [curs]. Nota: [nota]. Punts forts: [punts]. A millorar: [aspectes]. Versions de 50, 100 i 150 paraules. To positiu i constructiu. Idioma: [català/castellà]."</div></div>

<div class="pc"><div class="pn">Prompt 4 · Adaptació NEE</div>Adapta activitats per a alumnes amb necessitats<div class="pt">"Adapta aquesta activitat per a un alumne de [nivell] amb [dislèxia/TDAH/TEA/altes capacitats]: [activitat]. Manté els objectius, ajusta el format i el suport visual. Dona 4-5 orientacions per al docent."</div></div>

<div class="pc"><div class="pn">Prompt 5 · Activitats de repàs</div>Activitats gamificades per reforçar continguts<div class="pt">"Crea 5 activitats de repàs gamificades sobre [tema] per a [nivell]. Cada una: nom, descripció, durada màx 15 min, agrupament i materials. Inclou activitats competitives, cooperatives i creatives."</div></div>

<div class="pc"><div class="pn">Prompt 6 · Comunicat per a famílies</div>Redacta comunicats professionals<div class="pt">"Redacta un comunicat per a les famílies sobre [tema: excursió/incident/progrés]. To professional però proper. Màxim 150 paraules. Inclou data i signatura del tutor. Idioma: [català/castellà]."</div></div>

<div class="pc"><div class="pn">Prompt 7 · Preguntes d'examen</div>Genera bateries de preguntes amb solucionari<div class="pt">"Crea 10 preguntes d'avaluació sobre [tema] per a [nivell]. Mix: 4 test, 3 resposta curta, 2 raonament, 1 pregunta oberta. Dificultat progressiva. Inclou la solució al final."</div></div>

<div class="pc"><div class="pn">Prompt 8 · Feedback a l'alumne</div>Comentaris de retroalimentació motivadors<div class="pt">"Escriu un feedback constructiu per a un alumne sobre el seu treball de [tema]. Usa el model sandvitx (positiu → millora → positiu). To motivador. Punts forts: [punts]. A millorar: [aspectes]."</div></div>

<div class="pc"><div class="pn">Prompt 9 · Programació trimestral</div>Seqüencia els continguts del trimestre<div class="pt">"Crea una seqüenciació de continguts per a [assignatura] de [nivell] per al [trimestre]. Distribueix en [X] setmanes. Indica les competències LOMLOE i els criteris d'avaluació de cada bloc."</div></div>

<div class="pc"><div class="pn">Prompt 10 · Resolució de conflictes</div>Protocols per gestionar situacions d'aula<div class="pt">"Proposa un protocol pas a pas per gestionar [situació: conflicte/manca d'atenció/bullying lleu] a l'aula de [nivell]. Inclou com comunicar-ho a la família i al cap d'estudis."</div></div>

<div class="pc"><div class="pn">Prompt 11 · Projecte interdisciplinari</div>Connecta dues matèries en un projecte<div class="pt">"Dissenya un projecte de [durada] per a [nivell] que connecti [matèria 1] i [matèria 2] sobre [tema]. Inclou rols d'equip, producte final i criteris d'avaluació compartits."</div></div>

<div class="pc"><div class="pn">Prompt 12 · Inclusió i diversitat</div>Activitats inclusives per a tota la classe<div class="pt">"Redessenya aquesta activitat [enganxa-la] perquè sigui 100% inclusiva: accessibilitat visual, diversitat de ritmes i participació equitativa. Manté el nivell curricular del grup."</div></div>

<div class="pc"><div class="pn">Prompt 13 · Intel·ligències múltiples</div>Adapta una activitat als 8 tipus d'intel·ligència<div class="pt">"Adapta l'activitat sobre [tema] per treballar-la des de les 8 intel·ligències múltiples de Gardner. Per a cada intel·ligència, proposa una variant de màxim 15 minuts."</div></div>

<div class="pc"><div class="pn">Prompt 14 · IA a l'aula</div>Explica la IA als alumnes de forma pedagògica<div class="pt">"Crea una activitat de [durada] per explicar a alumnes de [nivell] com funciona la IA, els seus usos ètics i els seus límits. Inclou debat i reflexió crítica adaptats a l'edat."</div></div>

<div class="pc"><div class="pn">Prompt 15 · Autoavaluació</div>Fitxes d'autoavaluació i coavaluació<div class="pt">"Crea una fitxa d'autoavaluació i una de coavaluació per a [activitat] de [nivell]. Escala visual 1-4 cares per a Primària o numèrica per a ESO. Preguntes senzilles i concretes."</div></div>

<div class="cta"><a href="https://lamevaescola.com" class="btn">Prova les eines gratuïtes →</a></div>
<p style="font-size:0.85rem;color:#6B7B6B;line-height:1.6">Cada mes t'enviarem prompts nous i novetats de les eines. Si tens suggeriments, respon aquest email.</p>
</div>
<div class="footer">
Has rebut aquest email perquè et vas subscriure a <a href="https://lamevaescola.com" style="color:#2D6A4F">lamevaescola.com</a><br>
<a href="https://lamevaescola.com" style="color:#6B7B6B">Cancel·lar subscripció</a>
</div>
</div></body></html>`;

    await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": BREVO_API_KEY,
      },
      body: JSON.stringify({
        sender: { name: "La Meva Escola", email: "hola@lamevaescola.com" },
        to: [{ email, name: firstName }],
        subject: "Els teus 15 prompts per a docents 🎓",
        htmlContent: emailHtml,
      }),
    });

    return new Response(JSON.stringify({ ok: true }), {
      status: 200, headers: corsHeaders,
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
