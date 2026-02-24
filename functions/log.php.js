export async function onRequest(context) {
  try {
    if (context.request.method !== "POST") {
      return new Response("Method not allowed", { status: 405 });
    }

    const data = await context.request.json();

    const ip =
      context.request.headers.get("CF-Connecting-IP") || "unknown";

    const time = new Date().toISOString();

    await context.env.DB.prepare(
      "INSERT INTO logs (ip, page, consent, time) VALUES (?, ?, ?, ?)"
    )
      .bind(ip, data.page, data.consent, time)
      .run();

    return new Response(
      JSON.stringify({ status: "saved" }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500 }
    );
  }
}
