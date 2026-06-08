async function check() {
  try {
    const slug = 'ingoku-danchi';
    const url = `http://localhost:5173/api/samehadaku/details?slug=${slug}`;
    console.log(`Testing details endpoint: ${url}`);
    const response = await fetch(url);
    console.log(`Status: ${response.status} ${response.statusText}`);
    const data = await response.json();
    console.log(`Successfully parsed details JSON!`);
    console.log(`Title: ${data.title}`);
    console.log(`Genre: ${data.genre}`);
    console.log(`Total episodes parsed: ${data.episodes}`);
    if (data.episodesList && data.episodesList.length > 0) {
      console.log('First episode parsed:');
      console.log(JSON.stringify(data.episodesList[0], null, 2));
      console.log('Last episode parsed:');
      console.log(JSON.stringify(data.episodesList[data.episodesList.length - 1], null, 2));
    }
  } catch (e) {
    console.error('Error fetching details:', e);
  }
}

check();
