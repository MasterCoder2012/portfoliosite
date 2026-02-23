export async function onRequest(context) {
  if (context.request.method !== "POST") {
    return new Response("Use POST bro", { status: 405 });
  }

  try {
    const data = await context.request.json();

    const log = {
      time: new Date().toISOString(),
      ip: context.request.headers.get("CF-Connecting-IP") || "unknown",
      page: data.page || "",
      info: data.info || ""
    };

    console.log(JSON.stringify(log));

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
