export async function onRequest(context) {
  const url = new URL(context.request.url);
  const token = url.searchParams.get("token"); // pass as ?token=supersecret123

  if (token !== context.env.LOGS_TOKEN) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const result = await context.env.DB.prepare(
      `SELECT id, ip, page, consent, time, userAgent, referrer, language, deviceType
       FROM logs ORDER BY time DESC LIMIT 50`
    ).all();

    return new Response(JSON.stringify(result.results), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
