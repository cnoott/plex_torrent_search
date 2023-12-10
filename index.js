import express from 'express';
const app = express();
import bodyParser from 'body-parser';
const port = 4269;
import PirateBay from 'thepiratebayfixed';
import WebTorrent from 'webtorrent';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
dotenv.config();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const client = new WebTorrent();
// TODO:
// - "I'm feeling Lucky"
// - choose tvshow or movie option
// - diskspace full
// - show tip on how to choose a torrent
// - show tip on how to search
// - delete functionality

const activeTorrents = {};
const PATH_TO_MOVIES = process.env.PATH_TO_MOVIES;
const PATH_TO_TV = process.env.PATH_TO_TV;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname + '/views'));
app.set('view engine', 'ejs');

app.get('/', async (req, res) => {
  res.render('index');
});

app.get('/search', async (req, res) => {
  try {
    console.log('searching');
    const { query } = req.query;
    const searchResults = await PirateBay.search(query, {
      category: 'video',
      page: 0,
      orderBy: 'seeds',
    });
    console.log(Object.keys(searchResults[0]));
    res.render(
      'searchResults',
      {searchResults: searchResults}
    );
  }
  catch (err) {
    console.log(err);
    res.render('error');
  }
});

app.get('/choice', async (req, res) => {
  try {
    const magnetLink = decodeURIComponent(req.query.magnetLink);
    const name = decodeURIComponent(req.query.name);
    if (activeTorrents[magnetLink]) {
      res.redirect(
        `show-progress?magnetLink=${encodeURIComponent(magnetLink)}&name=${encodeURIComponent(name)}`
      );

      return;
    }
    console.log('path', PATH_TO_MOVIES);
    const torrent = await client.add(magnetLink, {path: PATH_TO_MOVIES});
    activeTorrents[magnetLink] = { progress: 0, name };
    console.log('torrenting', torrent);
    torrent.on('download', () => {
      activeTorrents[magnetLink].progress = (torrent.progress * 100).toFixed(2);
      console.log('activetorrent', JSON.stringify(activeTorrents[magnetLink]));
    });

    res.redirect(
      `show-progress?magnetLink=${encodeURIComponent(magnetLink)}&name=${encodeURIComponent(name)}`
    );
  } catch (err) {
    console.log(err);
    res.render('error');
  };
});

app.get('/progress', async (req, res) => {
  try { 
    const magnetLink = decodeURIComponent(req.query.magnetLink);
    console.log(magnetLink);
    const torrent = activeTorrents[magnetLink];
    console.log('progress');

    if (torrent) {
      const percentageComplete = torrent.progress;
      console.log(percentageComplete);
      console.log(typeof percentageComplete);
      if (percentageComplete === 100) {
        delete activeTorrents[magnetLink];
        res.redirect('complete');
      }
      res.json({percentageComplete});
    } else {
      res.status(404).json({ error: 'Torrent not found' });
    }
  } catch(err) {
    console.log(err);
    res.render('error');
  }
});

app.get('/show-progress', async (req, res) => {
  try {
    let name = '';
    if (activeTorrents[req.query.magnetLink]) {
      name = activeTorrents[req.query.magnetLink].name;
    }
    res.render('show-progress', {name});
  } catch (err) {
    console.log(err);
    res.render('error');
  }
});

app.get('/complete', async (req, res) => {
  try {
    let magnetLink = req.query.magnetLink;
    delete activeTorrents[magnetLink];   
    res.render('complete');
  } catch (err) {
    console.log(err);
    res.render('error');
  }
});

app.listen(port, () => {
  console.log(`Listening on port ${port}`);

});
