const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();

app.use('/public', express.static(path.join(__dirname, 'public')));

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname + '/index.html'))
});

app.listen(process.env.PORT || 4000, () => {
  if (process.env.PORT == undefined) {
    console.log('Server is running on port 4000')
  } else {
  console.log('Server is running on port ' + process.env.PORT)
  }
})
