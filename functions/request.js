export async function onRequest(context) {
  const { request, env } = context;

  try {
    const input = await request.json();

    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${env.ACCOUNT_ID}/ai/run/@cf/zai-org/glm-4.7-flash`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${env.API_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: input.messages,

          // Keep responses reasonably short
          max_tokens: 2048,

          // Lower randomness for more consistent answers
          temperature: 0.3,
        }),
      }
    );

    const result = await response.json();

    return new Response(JSON.stringify(result), {
      status: response.status,
      headers: {
        "Content-Type": "application/json",
      },
    });

  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }
}
