export async function onRequest() {
  const R2_URL = 'https://media.tresycuarto.com/nido/manifest.json';

  try {
    const r = await fetch(R2_URL + '?t=' + Date.now(), { cf: { cacheTtl: 0 } });
    if (!r.ok) {
      return new Response(JSON.stringify({ fotos: [] }), {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }
    const data = await r.text();
    return new Response(data, {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-cache, max-age=0'
      }
    });
  } catch {
    return new Response(JSON.stringify({ fotos: [] }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }
}
