import fetch from 'node-fetch';

export default async function handler(req, res) {
  const code = req.query.code;
  if (!code) return res.status(400).json({ error: 'codeがありません' });

  const params = new URLSearchParams({
    client_id: process.env.GITHUB_CLIENT_ID,
    client_secret: process.env.GITHUB_CLIENT_SECRET,
    code
  });

  const response = await fetch(`https://github.com/login/oauth/access_token?${params.toString()}`, {
    method: 'POST',
    headers: { Accept: 'application/json' },
  });

  const data = await response.json();
  res.status(200).json(data);
}
