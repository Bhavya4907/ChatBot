export async function POST(request) {
  const { messages, systemPrompt } = await request.json()

  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${process.env.GROQ_API_KEY}`
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      max_tokens: 500,
      messages: [
        { role: "system", content: systemPrompt },
        ...messages
      ]
    })
  })

  const data = await res.json()
  return Response.json({ reply: data.choices[0].message.content })
}