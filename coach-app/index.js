const aws = require('aws-sdk');
const express = require('express');
const expressLess = require('express-less');
const minify = require('express-minify');
const compression = require('compression');
const multer = require('multer');
const multerS3 = require('multer-s3');
const cors = require('cors');
const { Pool } = require('pg');
require('dotenv').config();

// aws config
aws.config.update({
  accessKeyId: process.env.S3_ACCESS_KEY_ID,
  secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
});

// s3 uploads
const s3 = new aws.S3();
const upload = multer({
  storage: multerS3({
    s3,
    bucket: process.env.S3_BUCKET,
    metadata(req, file, cb) {
      cb(null, { fieldName: file.fieldname });
    },
    key(req, file, cb) {
      cb(null, Date.now().toString());
    },
  }),
});

const connectionString = 'postgresql://tphamdn:WVrANYxZ2m3v@ep-odd-mouse-54062699.ap-southeast-1.aws.neon.tech/training-data?sslmode=require';
const pool = new Pool({
  connectionString,
});

const app = express();
app.use('/less-css', expressLess(`${__dirname}/client/less`));
app.use(compression());
app.use(minify());
app.use(express.static(`${__dirname}/static`));
app.use(cors());

app.use('/', express.static('client'));
app.post('/store', upload.single('image'), (req, response) => {
  const session = req.body.uuid;
  const timestamp = new Date();
  const client = (typeof req.headers['x-forwarded-for'] === 'string'
        && req.headers['x-forwarded-for'].split(',').shift())
        || req.connection?.remoteAddress
        || req.socket?.remoteAddress
        || req.connection?.socket?.remoteAddress;
  const { score } = req.body;
  const { image_index: imageIndex } = req.body;
  const { mode } = req.body;
  const fileUrl = req.file.location;

  const values = [session, timestamp, client, fileUrl, imageIndex, mode, score];
  console.log(values);

  const query = 'INSERT INTO examples(session, timestamp, client, image_url, image_index, mode, score) VALUES($1, $2, $3, $4, $5, $6, $7) RETURNING *';
  pool.query(query, values, (error) => {
    if (error) {
      throw error;
    }
    response.send('Store ok');
  });
});

// start app
app.listen(process.env.PORT, ('0.0.0.0'), () => {
  console.log(`Server is listening at http://0.0.0.0:${process.env.PORT}`);
});
