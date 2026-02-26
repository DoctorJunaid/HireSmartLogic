const express = require("express");
const app = express();

const PORT = 3000;

app.get("/", (req, res) => {
  res.status(200).json({
    isStatus: "working",
  });
});

app.listen(PORT, () => {
  console.log(`app is running on PORT ${PORT}`);
});
