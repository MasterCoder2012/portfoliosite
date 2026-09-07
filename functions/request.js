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

      // ==========================================================
      // Z.ai succeeded
      // ==========================================================
      if (zaiResponse.ok) {
        const zaiMessage = zaiResult?.choices?.[0]?.message;

        /*
         * Prefer normal content.
         * If Z.ai only gives us reasoning_content/reasoning,
         * preserve those as fallbacks.
         */
        const content =
          zaiMessage?.content ||
          zaiMessage?.reasoning_content ||
          zaiMessage?.reasoning ||
          null;

        if (content) {
          return new Response(
            JSON.stringify({
              ...zaiResult,

              // Guarantee a usable OpenAI-compatible message
              choices: zaiResult.choices?.map((choice, index) => {
                if (index !== 0) return choice;

                return {
                  ...choice,
                  message: {
                    ...choice.message,
                    content: content,
                  },
                };
              }),
            }),
            {
              status: zaiResponse.status,
              headers: {
                "Content-Type": "application/json",
              },
            }
          );
        }

        console.error(
          "Z.ai returned no usable content:",
          JSON.stringify(zaiResult)
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
          error:
            "Z.ai failed and Cloudflare fallback is not configured",
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

      /*
       * ==========================================================
       * Normalize Cloudflare response
       * ==========================================================
       *
       * Cloudflare Workers AI can return:
       *
       * {
       *   result: {
       *     response: "Hello..."
       *   }
       * }
       *
       * Your frontend expects:
       *
       * {
       *   choices: [
       *     {
       *       message: {
       *         content: "Hello..."
       *       }
       *     }
       *   ]
       * }
       *
       * So convert it here.
       */

      if (cloudflareResponse.ok) {
        const cloudflareContent =
          cloudflareResult?.result?.response ||
          cloudflareResult?.result?.content ||
          cloudflareResult?.response ||
          cloudflareResult?.content ||
          null;

        if (cloudflareContent) {
          return new Response(
            JSON.stringify({
              id: cloudflareResult?.result?.id || "cloudflare-fallback",
              object: "chat.completion",
              model: "@cf/zai-org/glm-4.7-flash",

              choices: [
                {
                  index: 0,
                  message: {
                    role: "assistant",
                    content: cloudflareContent,
                  },
                  finish_reason: "stop",
                },
              ],

              provider: "cloudflare",
            }),
            {
              status: 200,
              headers: {
                "Content-Type": "application/json",
              },
            }
          );
        }
      }

      console.error(
        "Cloudflare returned no usable content:",
        JSON.stringify(cloudflareResult)
      );

      return new Response(
        JSON.stringify({
          success: false,
          error: "Cloudflare AI returned no usable content",
          provider_response: cloudflareResult,
        }),
        {
          status: 502,
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
          details:
            cloudflareError instanceof Error
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
        error:
          error instanceof Error
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
