const ffmpeg = require('fluent-ffmpeg');
const path = require('path');

// Convert any video to vertical 9:16 MP4
function convertToVerticalMp4(inputPath, outputPath) {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .videoCodec('libx264')
      .size('576x1024') // 9:16 aspect ratio
      .aspect('9:16')
      .outputOptions('-preset', 'fast')
      .format('mp4')
      .on('end', () => resolve(outputPath))
      .on('error', reject)
      .save(outputPath);
  });
}

module.exports = { convertToVerticalMp4 };
