export async function onRequest(context) {
  const { request, env } = context;

  const input = await request.json();

  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${env.ACCOUNT_ID}/ai/run/@cf/zai-org/glm-4.7-flash`,
    {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${env.API_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(input),
    }
  );

  const result = await response.json();

  return new Response(JSON.stringify(result), {
    status: response.status,
    headers: {
      "Content-Type": "application/json",
    },
  });
}
