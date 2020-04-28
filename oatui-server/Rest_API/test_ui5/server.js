const express = require('express');
const app = express();

app.get('/get/buildStatusJson/:wpid', (req, res) => {
	let wid=req.params.wpid;
  res.send('Hello from App Engine!'+wid);
});

// Listen to the App Engine-specified port, or 8080 otherwise
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}...`);
});