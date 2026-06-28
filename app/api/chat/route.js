const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders })
}

export async function POST(request) {
  const { messages, systemPrompt, maxTokens } = await request.json()

  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${process.env.GROQ_API_KEY}`
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      max_tokens: maxTokens || 500,
      messages: [
        { role: "system", content: systemPrompt },
        ...messages
      ]
    })
  })

  const data = await res.json()

  if (!data.choices || !data.choices[0]) {
    console.error("Groq error:", data)
    return Response.json({ reply: null, error: data }, { headers: corsHeaders })
  }

  return Response.json({ reply: data.choices[0].message.content }, { headers: corsHeaders })
}
