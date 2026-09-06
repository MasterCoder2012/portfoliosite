export async function onRequest(context) {
  const { request, env } = context;

  try {
    const input = await request.json();

    if (!Array.isArray(input.messages)) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "messages must be an array",
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    if (!env.ZAI_API_KEY) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "ZAI_API_KEY is not configured",
        }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    const response = await fetch(
      "https://api.z.ai/api/paas/v4/chat/completions",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${env.ZAI_API_KEY}`,
          "Accept-Language": "en-US,en",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "glm-4.7-flash",
          messages: input.messages,
          temperature: 1.0,
          max_tokens: 2048,
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
        error: error instanceof Error ? error.message : String(error),
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
