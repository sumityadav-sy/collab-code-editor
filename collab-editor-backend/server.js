const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

// Test route
app.get("/", (req, res) => {
  res.send("Backend running 🚀");
});

// 🔥 AI ROUTE (THIS IS WHERE YOUR CODE GOES)
app.post("/api/ai", async (req, res) => {
  try {
    const { code, prompt } = req.body;

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "anthropic/claude-3-haiku",
        messages: [
          {
            role: "user",
            content: `Code:\n${code}\n\nQuestion: ${prompt}`
          }
        ]
      })
    });

    const data = await response.json();

    // DEBUG (optional)
    //console.log(data);

    res.json({
      reply: data.choices?.[0]?.message?.content || "No response"
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Something went wrong" });
  }
});

app.listen(3001, () => {
  console.log("Server running on http://localhost:3001 🚀");
});