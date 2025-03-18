const mongoose = require('mongoose');

const songSchema = new mongoose.Schema({
  title: String,
  artist: String,
  album: String,
  duration: Number,
  file_path: String,
});

module.exports = mongoose.model('Song', songSchema);