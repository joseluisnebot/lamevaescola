// Rate limiting per IP per a totes les rutes /api/*.
// Objectiu: evitar abús de les APIs (esgotar la quota de Groq) i email-bombing
// del formulari de subscripció. Disseny FAIL-OPEN: si el limitador falla per
// qualsevol motiu, la petició passa igualment (mai bloquegem per un bug propi).

const LIMIT_PER_MIN = {
  "/api/subscribe": 4,        // enviament d'emails: estricte
  "/api/nido-respostes": 10,  // escriptura pública a R2
};
const DEFAULT_LIMIT = 15;     // generadors d'IA i resta: 15/min per IP

async function verifyTurnstile(token, secret, ip) {
  try {
    const r = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ secret, response: token, remoteip: ip }),
    });
    const d = await r.json();
    return d.success === true;
  } catch (e) {
    return false;
  }
}

export async function onRequest(context) {
  const { request, env, next } = context;

  // El preflight CORS no consumeix quota
  if (request.method === "OPTIONS") return next();

  const ip = request.headers.get("CF-Connecting-IP") || "0.0.0.0";

  // Turnstile (s'activa sol quan hi ha TURNSTILE_SECRET configurat).
  // Token vàlid -> passa sense límit. Token absent/invàlid -> cau al rate-limit
  // de sota (fail-safe: mai bloquegem en dur, així no trenquem cap eina).
  if (env.TURNSTILE_SECRET && request.method === "POST") {
    const token = request.headers.get("cf-turnstile-token");
    if (token && (await verifyTurnstile(token, env.TURNSTILE_SECRET, ip))) {
      return next();
    }
  }

  try {
    if (env.DB) {
      const path = new URL(request.url).pathname;
      const limit = LIMIT_PER_MIN[path] || DEFAULT_LIMIT;
      const win = Math.floor(Date.now() / 60000); // finestra d'1 minut

      const key = `${ip}:${path}:${win}`;
      const row = await env.DB
        .prepare("INSERT INTO rate_limit (k,n,exp) VALUES (?,1,?) ON CONFLICT(k) DO UPDATE SET n=n+1 RETURNING n")
        .bind(key, win + 2)
        .first();
      const count = row ? row.n : 1;

      // Neteja oportunista de files caducades (sense bloquejar la resposta)
      if (Math.random() < 0.02) {
        context.waitUntil(
          env.DB.prepare("DELETE FROM rate_limit WHERE exp < ?").bind(win).run()
        );
      }

      if (count > limit) {
        return new Response(
          JSON.stringify({ error: "Massa peticions en poc temps. Espera un minut i torna-ho a provar." }),
          {
            status: 429,
            headers: {
              "Content-Type": "application/json",
              "Access-Control-Allow-Origin": "*",
              "Retry-After": "60",
            },
          }
        );
      }
    }
  } catch (e) {
    // fail-open
  }

  return next();
}
