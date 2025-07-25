const mongoose = require("mongoose");
mongoose
  .connect("mongodb+srv://hemalalitha:iUNuseMxlT9DdQt2@travel.akc8o.mongodb.net/?retryWrites=true&w=majority&appName=travel")
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));
