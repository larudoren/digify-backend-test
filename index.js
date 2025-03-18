require('dotenv').config();
const express = require('express');
const multer = require('multer');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const swaggerDocument = YAML.load('./swagger.yaml');
const Song = require('./models/Song');

const app = express();
const port = 5000;

app.use(express.json()); 
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log('MongoDB Connected'))
  .catch((err) => console.log(err));

  
  const authenticateJWT = (req, res, next) => {
    const authHeader = req.headers.authorization;
  
    if (authHeader) {
      const token = authHeader.split(' ')[1];
  
      jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
          return res.sendStatus(403);
        }
  
        req.user = user;
        next();
      });
    } else {
      res.sendStatus(401);
    }
  };

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
      cb(null, Date.now() + '-' + file.originalname);
    },
});
  
const upload = multer({ storage });

// app.post('/upload', upload.single('file'), (req, res) => {
//     if (!req.file) {
//       return res.status(400).json({ error: 'No file uploaded' });
//     }
//     res.json({ message: 'File uploaded successfully', filename: req.file.filename });
//   });

app.post('/songs', upload.single('audio'), async (req, res) => {
    const { title, artist, album, duration } = req.body;
    const filePath = req.file.path;
  
    try {
      const newSong = new Song({
        title,
        artist,
        album,
        duration,
        file_path: filePath,
      });
  
      const savedSong = await newSong.save();
      res.json(savedSong);
    } catch (err) {
      console.error(err);
      res.status(500).send('Error inserting data');
    }
});

app.get('/songs', async (req, res) => {
    try {
      const songs = await Song.find();
      res.json(songs);
    } catch (err) {
      console.error(err);
      res.status(500).send('Error fetching data');
    }
  });

app.get('/songs/:id/stream', async (req, res) => {
    const { id } = req.params;
  
    try {
      const song = await Song.findById(id);
      if (song) {
        res.sendFile(song.file_path, { root: __dirname });
      } else {
        res.status(404).send('Song not found');
      }
    } catch (err) {
      console.error(err);
      res.status(500).send('Error fetching song');
    }
  });

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});

