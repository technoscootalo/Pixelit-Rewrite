const express = require("express");
const router = express.Router();

const Banner = require("../../models/Banner");

router.get("/", async (req, res) => {
  const banners = await Banner.find();
  res.json(banners);
});

router.post("/create", async (req, res) => {
  const banner = await Banner.create(req.body);
  res.json(banner);
});

router.put("/:id", async (req, res) => {
  const banner = await Banner.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(banner);
});

module.exports = router;