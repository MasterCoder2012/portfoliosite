export async function onRequestPost(context) {
  const { request, env } = context;

  let body = {};
  try {
    body = await request.json();
  } catch {}

  const ip = request.headers.get("CF-Connecting-IP") || "unknown";
  const userAgent = request.headers.get("User-Agent") || "unknown";
  const time = new Date().toISOString();
  const page = body.page || "unknown";
  const consent = body.consent || "unknown";

  await env.MY_BINDING.prepare(
    "INSERT INTO logs (ip, time, userAgent, page, consent) VALUES (?, ?, ?, ?, ?)"
  )
    .bind(ip, time, userAgent, page, consent)
    .run();

  return new Response("logged");
}
