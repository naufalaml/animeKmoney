async function check() {
  try {
    const targetUrl = 'https://samehadaku.li/';
    const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}`;
    console.log(`Fetching from proxy: ${proxyUrl}`);
    const response = await fetch(proxyUrl);
    console.log(`Status: ${response.status} ${response.statusText}`);
    const text = await response.text();
    console.log(`Length: ${text.length}`);
    console.log(`Snippet: ${text.substring(0, 300).replace(/\s+/g, ' ')}`);
  } catch (e) {
    console.error(e);
  }
}

check();
