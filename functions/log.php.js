export async function onRequest(context) {
  const { request } = context;

  if (request.method !== "POST") {
    return new Response("Use POST", { status: 405 });
  }

  let data = {};
  try {
    data = await request.json();
  } catch (err) {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), { status: 400 });
  }

  // Just log to console for now
  console.log("Visitor log:", {
    ip: request.headers.get("CF-Connecting-IP") || "unknown",
    page: data.page || "unknown",
    consent: data.consent || "unknown",
    time: new Date().toISOString()
  });

  return new Response(JSON.stringify({ status: "ok" }), { headers: { "Content-Type": "application/json" } });
};
