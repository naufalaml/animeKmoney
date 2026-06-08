async function check() {
  try {
    const url = 'http://localhost:5173/api/samehadaku/trending';
    console.log(`Testing endpoint: ${url}`);
    const response = await fetch(url);
    console.log(`Status: ${response.status} ${response.statusText}`);
    const data = await response.json();
    console.log(`Successfully parsed JSON! Total animes: ${data.animes ? data.animes.length : 0}`);
    if (data.animes && data.animes.length > 0) {
      console.log('Sample anime properties:');
      console.log(JSON.stringify(data.animes[0], null, 2));
    }
  } catch (e) {
    console.error('Error fetching endpoint:', e);
  }
}

check();
