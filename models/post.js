const mongoose = require("mongoose");
const tinylinkSchema = new mongoose.Schema({
  url: String,
  code: String,
  clicks: { type: Number, default: 0 },
  lastClicked: {
    type: Date,
    default: "-",
  },
});
const tinylinkModel = mongoose.model("urls", tinylinkSchema);
module.exports = tinylinkModel;
