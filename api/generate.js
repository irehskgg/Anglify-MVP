export default async function handler(req, res) {
  try {
    const { idea } = req.body;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-3-sonnet-20240229",
        max_tokens: 800,
        messages: [
          {
            role: "user",
            content: `Generate viral hooks for: ${idea}`
          }
        ]
      })
    });

    const data = await response.json();

    // 🔥 DEBUG LINE (IMPORTANT)
    console.log("Claude response:", data);

    if (!response.ok) {
      return res.status(500).json({
        error: data.error || "Claude API failed"
      });
    }

    res.status(200).json({
      text: data.content?.[0]?.text || "No response"
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server crashed" });
  }
}
