export async function onRequest(context) {
  try {
    if (context.request.method !== "POST") {
      return new Response("Method not allowed", { status: 405 });
    }

    const data = await context.request.json();
    const inputPassword = data.password;

    // Server-side password check
    if (inputPassword !== context.env.LOGS_PASSWORD) {
      return new Response(JSON.stringify({ error: "Unauthorized. LOL. " }), { status: 401 });
    }

    // Fetch logs from D1
    const result = await context.env.DB.prepare(
      `SELECT id, ip, page, consent, time, userAgent, referrer, language, deviceType
       FROM logs ORDER BY time DESC LIMIT 1000`
    ).all();

    return new Response(JSON.stringify(result.results), {
      headers: { "Content-Type": "application/json" }
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
