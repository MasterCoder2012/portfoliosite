
export async function onRequest(context) {
  const response = await context.env.ASSETS.fetch(
    new Request(new URL("/legacy.txt", context.request.url))
  );

  if (!response.ok) {
    return new Response("legacy.txt not found", {
      status: 404
    });
  }

  return new Response(response.body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache"
    }
  });
}
