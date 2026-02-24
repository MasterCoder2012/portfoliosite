export async function onRequest(context) {
  console.log("FUNCTION HIT");

  try {
    if (context.request.method !== "POST") {
      return new Response("Method not allowed", { status: 405 });
    }

    const data = await context.request.json();
    console.log("DATA:", data);

    const ip =
      context.request.headers.get("CF-Connecting-IP") || "unknown";

    console.log("IP:", ip);

    const time = new Date().toISOString();

    const result = await context.env.DB.prepare(
      "INSERT INTO logs (ip, page, consent, time) VALUES (?, ?, ?, ?)"
    )
      .bind(ip, data.page, data.consent, time)
      .run();

    console.log("DB RESULT:", result);

    return new Response("ok");
  } catch (err) {
    console.log("ERROR:", err);
    return new Response(err.toString(), { status: 500 });
  }
}
