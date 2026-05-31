export default async function handler(req, res) {
    // Permite apenas requisições do tipo POST
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Método não permitido' });
    }

    // Pega a chave secreta configurada no painel do Vercel
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        return res.status(500).json({ error: 'Chave de API não configurada no servidor Vercel.' });
    }

    try {
        const { message } = req.body;

        // Chamada oficial atualizada para o modelo gemini-2.5-flash
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: message }]
                }]
            })
        });

        const data = await response.json();
        
        if (!response.ok) {
            return res.status(response.status).json({ error: data.error?.message || 'Erro na API do Gemini' });
        }

        const botReply = data.candidates[0].content.parts[0].text;
        return res.status(200).json({ reply: botReply });

    } catch (error) {
        return res.status(500).json({ error: 'Erro interno no servidor do chat.' });
    }
}