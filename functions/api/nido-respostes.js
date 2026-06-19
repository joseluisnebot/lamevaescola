const KEY = 'nido/respostes.json';
const MAX = 100;

export async function onRequest({ request, env }) {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*'
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, { headers });
  }

  if (request.method === 'GET') {
    const obj = await env.MEDIA.get(KEY);
    if (!obj) return new Response(JSON.stringify({ respostes: [], total: 0 }), { headers });
    const text = await obj.text();
    return new Response(text, { headers });
  }

  if (request.method === 'POST') {
    try {
      let body;
      try { body = await request.json(); }
      catch { return new Response(JSON.stringify({ ok: false, error: 'JSON invàlid' }), { status: 400, headers }); }

      const classe = String(body.classe || '').trim().slice(0, 80);
      const resposta = String(body.resposta || '').trim().slice(0, 200);
      const preguntaId = parseInt(body.pregunta_id) || 0;

      if (!classe || !resposta) {
        return new Response(JSON.stringify({ ok: false, error: 'Falten dades' }), { status: 400, headers });
      }

      const obj = await env.MEDIA.get(KEY);
      let data = { respostes: [], total: 0 };
      if (obj) {
        try { data = JSON.parse(await obj.text()); } catch {}
      }

      const ts = new Date().toISOString();
      data.respostes.unshift({ id: Date.now().toString(36), classe, resposta, pregunta_id: preguntaId, ts });
      data.respostes = data.respostes.slice(0, MAX);
      data.total = (data.total || 0) + 1;

      await env.MEDIA.put(KEY, JSON.stringify(data), {
        httpMetadata: { contentType: 'application/json' }
      });

      return new Response(JSON.stringify({ ok: true, total: data.total }), { headers });
    } catch(e) {
      return new Response(JSON.stringify({ ok: false, error: e.message }), { status: 500, headers });
    }
  }

  return new Response('Method not allowed', { status: 405, headers });
}
