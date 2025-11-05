export default async function handler(req, res) {
  // CORSとプリフライト対応
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');

  // プリフライトリクエスト
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // GET と POST の両方に対応
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // GETの場合はクエリパラメータから、POSTの場合はボディから code を取得
    const code = req.query?.code || req.body?.code;

    console.log('🔍 Received code:', code);
    console.log('📦 GITHUB_CLIENT_ID:', process.env.GITHUB_CLIENT_ID ? '✅ Set' : '❌ Not set');
    console.log('📦 GITHUB_CLIENT_SECRET:', process.env.GITHUB_CLIENT_SECRET ? '✅ Set' : '❌ Not set');

    if (!code) {
      return res.status(400).json({ error: 'code parameter is required' });
    }

    if (!process.env.GITHUB_CLIENT_ID || !process.env.GITHUB_CLIENT_SECRET) {
      console.error('❌ Environment variables not set');
      return res.status(500).json({ 
        error: 'Server configuration error',
        details: 'GITHUB_CLIENT_ID or GITHUB_CLIENT_SECRET not set'
      });
    }

    console.log('📤 Requesting GitHub access token...');

    // GitHub OAuth トークン取得
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code: code,
      }),
    });

    console.log('📥 GitHub Response Status:', tokenResponse.status);

    const text = await tokenResponse.text();
    console.log('📝 GitHub Response:', text.substring(0, 200));

    // レスポンスが JSON なのか確認
    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      console.error('❌ Failed to parse GitHub response as JSON');
      console.error('Raw response:', text);
      return res.status(500).json({ 
        error: 'Invalid response from GitHub',
        details: text.substring(0, 500)
      });
    }

    console.log('✅ Parsed data:', {
      access_token: data.access_token ? '✅ Present' : '❌ Missing',
      token_type: data.token_type,
      scope: data.scope,
      error: data.error,
    });

    if (data.error) {
      console.error('❌ GitHub Error:', data.error, data.error_description);
      return res.status(400).json({ 
        error: data.error,
        error_description: data.error_description,
      });
    }

    if (!data.access_token) {
      console.error('❌ No access_token in response');
      return res.status(500).json({ 
        error: 'No access token received from GitHub',
        response: data
      });
    }

    console.log('✅ Token obtained successfully');

    return res.status(200).json({
      access_token: data.access_token,
      token_type: data.token_type || 'bearer',
      scope: data.scope,
    });

  } catch (error) {
    console.error('❌ Exception:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
}
