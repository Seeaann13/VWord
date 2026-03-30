import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { text } = await req.json();
    console.log('[Groq API] Processing text:', text.substring(0, 50) + '...');
    
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      console.error('[Groq API] Missing GROQ_API_KEY');
      return NextResponse.json({ error: 'Missing GROQ_API_KEY' }, { status: 500 });
    }

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { 
            role: 'system', 
            content: '你是一個單字擷取助手。請從輸入的 OCR 文字中，擷取**所有**有意義的英文單字或短語。如果輸入的文字看起來沒有英文單字（例如純數字、純中文、發票號碼），請回傳空陣列。Output ONLY valid JSON with a `words` key containing an array of objects with keys: `word`, `phonetic`, `translation`, `example`.' 
          },
          { 
            role: 'user', 
            content: `請分析以下 OCR 文字，擷取所有有意義的英文單字或短語，並提供音標、繁體中文翻譯及英文例句：\n\nOCR Text: ${text}` 
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.1
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('[Groq API] Error response:', errorData);
      throw new Error(`Groq API responded with status ${response.status}: ${errorData}`);
    }

    const data = await response.json();
    const result = JSON.parse(data.choices[0].message.content);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Groq API Error:', error);
    return NextResponse.json({ error: 'Failed to process text with Groq' }, { status: 500 });
  }
}
