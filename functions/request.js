```javascript
export async function onRequest(context) {
  const { request, env } = context;

  try {
    const input = await request.json();

    // Validate request
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

    /*
     * ============================================================
     * 1. PRIMARY: Z.ai
     * ============================================================
     */

    try {
      if (!env.ZAI_API_KEY) {
        throw new Error("ZAI_API_KEY is not configured");
      }

      const zaiResponse = await fetch(
        "https://api.z.ai/api/paas/v4/chat/completions",
        {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${env.ZAI_API_KEY}`,
            "Accept-Language": "en-US,en",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "glm-5.3",
            messages: input.messages,
            temperature: 1.0,
            max_tokens: 1024,
          }),
        }
      );

      const zaiResult = await zaiResponse.json();

      // Z.ai succeeded
      if (zaiResponse.ok) {
        return new Response(
          JSON.stringify(zaiResult),
          {
            status: zaiResponse.status,
            headers: {
              "Content-Type": "application/json",
            },
          }
        );
      }

      // Z.ai failed, continue to Cloudflare fallback
      console.error(
        "Z.ai failed:",
        zaiResponse.status,
        JSON.stringify(zaiResult)
      );

    } catch (zaiError) {
      // Network/API error — continue to Cloudflare fallback
      console.error("Z.ai error:", zaiError);
    }

    /*
     * ============================================================
     * 2. FALLBACK: Cloudflare Workers AI
     * ============================================================
     */

    if (!env.ACCOUNT_ID || !env.API_TOKEN) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Z.ai failed and Cloudflare fallback is not configured",
        }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    try {
      const cloudflareResponse = await fetch(
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
            max_tokens: 1024,

            // Slightly more deterministic fallback
            temperature: 0.3,
          }),
        }
      );

      const cloudflareResult = await cloudflareResponse.json();

      return new Response(
        JSON.stringify(cloudflareResult),
        {
          status: cloudflareResponse.status,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

    } catch (cloudflareError) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Both AI providers failed",
          details: cloudflareError instanceof Error
            ? cloudflareError.message
            : String(cloudflareError),
        }),
        {
          status: 502,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error
          ? error.message
          : String(error),
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
```
