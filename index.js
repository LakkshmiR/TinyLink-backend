const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();

const tinylinkModel = require("./models/post");
app.use(cors());
app.use(express.json());
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("Mongodb Connected"))
  .catch((err) => console.log(err));
app.post("/add", async (req, res) => {
  const url = req.body.url;
  let code = req.body.customCode;
  //TO validate URL
  try {
    new URL(url);
  } catch {
    return res.json("Invalid URL");
  }
  if (code) {
    if (!/^[A-Za-z0-9]{6,8}$/.test(code)) {
      return res.json({ message: "custom code must be 6-8 alphanumeric charaters" });
    } else {
      const exists = await tinylinkModel.findOne({ code });
      if (exists) {
        return res.status(409).json({ message: "custom code already exists" });
      }
    }
  } else {
    function generateCode(length = 6) {
      const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
      let code = "";
      for (let i = 0; i < length; i++) {
        code = code + chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return code;
    }
    code = generateCode();
    while (await tinylinkModel.findOne({ code })) {
      code = generateCode();
    }
  }
  const newLink = await tinylinkModel.create({
    url: url,
    code: code,
    clicks: 0,
    lastClicked: null,
  });
  res.json(newLink);
});
//get
app.get("/get", (req, res) => {
  tinylinkModel
    .find()
    .then((result) => {
      res.json(result);
    })
    .catch((err) => res.json(err));
});
//health check
app.get("/healthz", (req, res) => {
  res.status(200).json({ ok: true, version: "1.0" });
});
//redirect
app.get("/:code", async (req, res) => {
  try {
    const code = req.params.code;
    const link = await tinylinkModel.findOne({ code });
    if (!link) {
      return res.status(404).send("Link not found");
    }
    link.clicks += 1;
    link.lastClicked = new Date();
    await link.save();
    return res.redirect(link.url);
  } catch (err) {
    res.json(err);
  }
});
//delete
app.delete("/delete/:id", (req, res) => {
  const { id } = req.params;
  tinylinkModel
    .findByIdAndDelete({ _id: id })
    .then((res) => res.json({ message: "Deleted Successfully!!!" }))
    .catch((err) => res.json(err));
});

//get stats data
app.get("/get/:code", async (req, res) => {
  const code = req.params.code;
  try {
    const statsdata = await tinylinkModel.findOne({ code });
    if (!statsdata) {
      return res.status(404).json({ message: "Link not found" });
    }
    res.json(statsdata);
  } catch (err) {
    res.status(500).json({ message: "Server Error" });
  }
});
app.get("/", (req, res) => {
  res.send("Backend running successfully 🚀");
});
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
