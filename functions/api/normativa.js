export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);

  const comunitat = url.searchParams.get("comunitat") || "";
  const tipus = url.searchParams.get("tipus") || "";
  const limit = Math.min(parseInt(url.searchParams.get("limit") || "20"), 50);
  const offset = parseInt(url.searchParams.get("offset") || "0");

  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Content-Type": "application/json",
    "Cache-Control": "public, max-age=1800",
  };

  try {
    let where = [];
    let params = [];
    if (comunitat) { where.push("comunitat = ?"); params.push(comunitat); }
    if (tipus)     { where.push("tipus = ?"); params.push(tipus); }

    const whereClause = where.length ? `WHERE ${where.join(" AND ")}` : "";

    const [rows, countRow] = await Promise.all([
      env.DB.prepare(`SELECT id, comunitat, data, titol, resum, url, tipus, keywords
                      FROM normativa ${whereClause}
                      ORDER BY data DESC, creat_at DESC
                      LIMIT ? OFFSET ?`)
        .bind(...params, limit, offset).all(),
      env.DB.prepare(`SELECT COUNT(*) as total FROM normativa ${whereClause}`)
        .bind(...params).first(),
    ]);

    return new Response(JSON.stringify({
      normativa: rows.results || [],
      total: countRow?.total || 0,
      limit,
      offset,
    }), { status: 200, headers: corsHeaders });

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
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
