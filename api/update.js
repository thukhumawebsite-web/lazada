export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { password, data } = req.body;
  const { GITHUB_TOKEN, GITHUB_OWNER, GITHUB_REPO, ADMIN_PASSWORD } = process.env;

  // 1. Password Verification
  if (!password || password !== ADMIN_PASSWORD) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  if (!GITHUB_TOKEN || !GITHUB_OWNER || !GITHUB_REPO) {
    return res.status(500).json({ success: false, message: 'GitHub environment variables missing.' });
  }

  const filePath = 'data.json';
  const url = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${filePath}`;

  try {
    // 2. Fetch current file SHA from GitHub
    const getRes = await fetch(url, {
      headers: {
        'Authorization': `token ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'Vercel-Serverless-App'
      }
    });

    if (!getRes.ok) {
      throw new Error(`Failed to get file info: ${getRes.statusText}`);
    }

    const fileInfo = await getRes.json();
    const currentSha = fileInfo.sha;

    // 3. Update data.json with Base64 encoding
    const contentEncoded = Buffer.from(JSON.stringify(data, null, 2)).toString('base64');

    const updateRes = await fetch(url, {
      method: 'PUT',
      headers: {
        'Authorization': `token ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
        'User-Agent': 'Vercel-Serverless-App'
      },
      body: JSON.stringify({
        message: 'Update data.json via Admin Panel',
        content: contentEncoded,
        sha: currentSha
      })
    });

    if (!updateRes.ok) {
      const errData = await updateRes.json();
      throw new Error(errData.message || 'Failed to update GitHub content');
    }

    return res.status(200).json({ success: true, message: 'Products updated successfully.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}
