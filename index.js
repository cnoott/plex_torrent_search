const express = require('express');
const app = express();
const port = 4269;
const PirateBay = require('thepiratebayfixed');



app.get('/', async (req, res) => {
    console.log('searching');
    const searchResults = await PirateBay.search('Prometheus', {
        category: 'video',
        page: 0,
        orderBy: 'seeds',
    })

    console.log(searchResults);

    res.send('ok');
});

app.listen(port, () => {
    console.log(`Listening on port ${port}`);
});
