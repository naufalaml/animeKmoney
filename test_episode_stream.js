async function check() {
  try {
    const epUrl = 'https://samehadaku.li/ingoku-danchi-episode-10-subtitle-indonesia/';
    const url = `http://localhost:5173/api/samehadaku/episode?url=${encodeURIComponent(epUrl)}`;
    console.log(`Testing episode stream endpoint: ${url}`);
    const response = await fetch(url);
    console.log(`Status: ${response.status} ${response.statusText}`);
    const data = await response.json();
    console.log(`Successfully parsed stream JSON! Total servers: ${data.servers ? data.servers.length : 0}`);
    if (data.servers) {
      data.servers.forEach((server, index) => {
        console.log(`Server ${index}:`);
        console.log(`  Name: ${server.name}`);
        console.log(`  Src: ${server.src}`);
      });
    }
  } catch (e) {
    console.error('Error fetching episode streams:', e);
  }
}

check();
