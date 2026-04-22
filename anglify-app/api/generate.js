export default async function handler(req, res) {
    try {
      const { idea } = req.body;
  
      const prompt = `Generate viral hooks and a short script for: ${idea}`;
  
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": "PASTE_YOUR_KEY_HERE",
          "anthropic-version": "2023-06-01"
        },
        body: JSON.stringify({
          model: "claude-3-sonnet-20240229",
          max_tokens: 800,
          messages: [
            {
              role: "user",
              content: prompt
            }
          ]
        })
      });
  
      const data = await response.json();
  
      res.status(200).json({
        result: data.content[0].text
      });
  
    } catch (error) {
      res.status(500).json({ error: "Something broke" });
    }
  }