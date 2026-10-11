
export async function onRequest(context) {
  const assetUrl = new URL("/legacy.txt", context.request.url);

  const response = await context.env.ASSETS.fetch(
    new Request(assetUrl, context.request)
  );

  if (!response.ok) {
    return new Response("legacy.txt not found", {
      status: 404
    });
  }

  return new Response(response.body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "no-cache"
    }
  });
}
