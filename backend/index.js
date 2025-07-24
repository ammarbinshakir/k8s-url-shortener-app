const express = require("express");
const db = require("./db");
const redis = require("./redis");
const routes = require("./routes");

const app = express();
app.use(express.json());
app.use("/", routes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () =>
  console.log(`Server running on port ${PORT}`)
);
