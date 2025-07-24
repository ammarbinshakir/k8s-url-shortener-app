const express = require("express");
const { nanoid } = require("nanoid");
const db = require("./db");
const redis = require("./redis");
const router = express.Router();

// Health check endpoints
router.get("/health", async (req, res) => {
  try {
    // Check database connection
    await db.query("SELECT 1");

    // Check Redis connection
    await redis.ping();

    res.status(200).json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      services: {
        database: "connected",
        redis: "connected",
      },
    });
  } catch (error) {
    res.status(503).json({
      status: "unhealthy",
      timestamp: new Date().toISOString(),
      error: error.message,
      services: {
        database: "error",
        redis: "error",
      },
    });
  }
});

router.get("/health/liveness", (req, res) => {
  // Simple liveness probe - just check if the service is running
  res.status(200).json({
    status: "alive",
    timestamp: new Date().toISOString(),
  });
});

router.get("/health/readiness", async (req, res) => {
  try {
    // Check if service is ready to accept traffic
    await db.query("SELECT 1");
    await redis.ping();

    res.status(200).json({
      status: "ready",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(503).json({
      status: "not ready",
      timestamp: new Date().toISOString(),
      error: error.message,
    });
  }
});

router.post("/shorten", async (req, res) => {
  const { original_url } = req.body;
  const short_id = nanoid(7);

  await db.query("INSERT INTO urls (short_id, original_url) VALUES ($1, $2)", [
    short_id,
    original_url,
  ]);
  await redis.set(short_id, original_url);

  res.json({ short_id });
});

router.get("/:short_id", async (req, res) => {
  const { short_id } = req.params;
  let original_url = await redis.get(short_id);

  if (!original_url) {
    const result = await db.query(
      "SELECT original_url FROM urls WHERE short_id = $1",
      [short_id]
    );
    if (!result.rows.length) return res.status(404).send("Not found");
    original_url = result.rows[0].original_url;
    await redis.set(short_id, original_url);
  }

  res.redirect(original_url);
});

module.exports = router;
