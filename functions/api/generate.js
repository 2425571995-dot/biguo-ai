export async function onRequestPost({ request, env }) {
  const { product, features, price, audience } = await request.json().catch(() => ({}))
  if (!product) {
    return new Response(JSON.stringify({ error: '请输入产品名称' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const prompt = `你是小红书爆款文案专家。根据以下产品信息，生成3条小红书风格的种草文案。

产品：${product}
卖点：${features || '请根据产品名称自行提炼'}
价格：${price || '未提供'}
目标人群：${audience || '普通消费者'}

要求：
- 每条文案包含：吸睛标题、正文（150-300字）、3-5个话题标签
- 语气自然亲切，像真实用户分享而非广告
- 善用emoji，但不能过度
- 包含具体使用场景和真实感受

请严格按照以下JSON格式输出，不要输出其他内容：
[{"title":"标题","content":"正文内容","tags":["标签1","标签2","标签3"]}]`

  try {
    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${env.DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: '你是一个小红书爆款文案生成助手。只输出JSON，不输出其他内容。' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.9,
        max_tokens: 2048,
      }),
    })

    const data = await response.json()
    if (!response.ok) {
      return new Response(JSON.stringify({ error: data.error?.message || 'AI 服务异常' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const raw = data.choices[0].message.content
    const cleaned = raw.replace(/```json\n?/g, '').replace(/```/g, '').trim()

    return new Response(JSON.stringify({ posts: JSON.parse(cleaned) }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message || '服务器错误' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
