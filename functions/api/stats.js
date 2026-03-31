export async function onRequestGet(context) {
  const { env } = context;
  const cors = { "Access-Control-Allow-Origin": "*", "Content-Type": "application/json" };
  try {
    const rows = await env.DB.prepare(
      "SELECT eina, SUM(usos) as total FROM estadistiques GROUP BY eina ORDER BY total DESC"
    ).all();
    return new Response(JSON.stringify({ stats: rows.results }), { headers: cors });
  } catch {
    return new Response(JSON.stringify({ stats: [] }), { headers: cors });
  }
}
