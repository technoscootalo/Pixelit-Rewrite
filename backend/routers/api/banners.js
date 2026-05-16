const express = require("express");
const router = express.Router();

const Banner = require("../../models/Banner");
const { requireDeveloperAccess } = require("../../middleware/panelAuth");


router.get("/", async (req, res) => {
  const banners = await Banner.find();
  res.json(banners);
});

router.post("/create", requireDeveloperAccess(), async (req, res) => {

  const banner = await Banner.create(req.body);
  res.json(banner);
});

router.put("/:id", requireDeveloperAccess(), async (req, res) => {

  const banner = await Banner.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(banner);
});

module.exports = router;