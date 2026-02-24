export async function onRequest(context) {
  try {
    if (context.request.method !== "POST") {
      return new Response("Method not allowed", { status: 405 });
    }

    const data = await context.request.json();

    const ip =
      context.request.headers.get("CF-Connecting-IP") || "unknown";

    console.log("LOG:", {
      ip,
      page: data.page,
      consent: data.consent,
    });

    return new Response(
      JSON.stringify({ status: "ok" }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500 }
    );
  }
}
