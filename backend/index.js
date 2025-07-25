require("dotenv").config();

const config = require("./config.json");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const upload = require("./multer");
const fs = require("fs");
const path = require("path");

const { authenticateToken } = require("./utilities");

const User = require("./models/user.model");
const TravelBlog = require("./models/travelBlog.model");

//mongoose.connect(config.connectionString);

mongoose.connect(config.connectionString)
    .then(() => console.log("Connected to MongoDB"))
    .catch((err) => console.error("MongoDB connection error:", err));


const app = express();
app.use(express.json());
app.use(cors({origin: "*"}));


app.get("/", (req, res) => {
    res.send("Welcome to the API");
});
 
app.post("/create-account", async(req,res) => {
    console.log("Request body:", req.body);
    const { fullName, email, password } = req.body;

    if (!fullName || !email || !password){
        return res
            .status(400)
            .json({ error: true, message: "All fields are required" });
    }

    const isUser = await User.findOne({ email});
    if (isUser) {
        return res
            .status(400)
            .json({error: true, message: "User already exists"});
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
        fullName,
        email,
        password: hashedPassword,
    });

    await user.save();

    const accessToken = jwt.sign(
        { userId: user._id },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: "72h",
        }
    );

    return res.status(201).json({
        error: false,
        user: { fullName: user.fullName, email: user.email },
        accessToken,
        message: "Registration Successful",
    });
});

app.post("/login", async (req,res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({message: "Email and Password are required"});
    }

    const user = await User.findOne({ email });
    if (!user) {
        return res.status(400).json({ message: "User not found" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if(!isPasswordValid) {
        return res.status(400).json({ message: "Invalid Credentials" });
    }

    const accessToken = jwt.sign(
        { userId: user._id },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: "72h",
        }
    );

    return res.json({
        error: false,
        message: "Login Successful",
        user: { fullName: user.fullName, email: user.email },
        accessToken,
        });
});

app.get("/get-user", authenticateToken, async (req,res) => {
    const { userId } = req.user;
    
    const isUser = await User.findOne({ _id: userId });

    if(!isUser) {
        return res.sendStatus(401);
    }

    return res.json({
        user: isUser,
        message: "",
    });
});

app.post("/image-upload", upload.single("image"), async (req, res) => {
    try {
        if (!req.file) {
            return res
                .status(400)
                .json({ error: true, message: "No image uploaded" });
        }
        
        const imageUrl = `http://localhost:8000/uploads/${req.file.filename}`;

        res.status(200).json({ imageUrl });
    } catch {
        res.status(500).json({ error: true, message: error.message });
    }
});

app.delete("/delete-image", async (req, res) => {
    const { imageUrl } = req.query;

    if (!imageUrl) {
        return res
            .status(400)
            .json({ error: true, message: "imageUrl parameter is required" });
    }

    try {
        const filename = path.basename(imageUrl);

        const filePath = path.join(__dirname, 'uploads', filename);

        if(fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            res.status(200).json({ message: "Image deleted successfully" });
        } else {
            res.status(200).json({ error: true, message: "Image not found" });
        }
    } catch (error) {
        res.status(500).json({ error: true, message: error.message });
    }
});

app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/assets", express.static(path.join(__dirname, "assets")));

app.post("/add-travel-blog", authenticateToken, async (req, res) => {
    const { title, story, visitedLocation, imageUrl, visitedDate } = req.body;
    const { userId } = req.user

    if (!title || !story || !visitedLocation || !imageUrl || !visitedDate) {
        return res.status(400).json({ error: true, message: "All fields are required" });
    }

    const parsedVisitedDate = new Date(parseInt(visitedDate));

    try {
        const travelBlog = new TravelBlog({
            title,
            story,
            visitedLocation,
            userId,
            imageUrl,
            visitedDate: parsedVisitedDate,
        });

        await travelBlog.save();
        res.status(201).json({ story: travelBlog, message:'Added Successfully' });
    }   catch (error) {
        res.status(400).json({ error: true, message: error.message });
    }
});

app.get("/get-all-blogs", authenticateToken, async (req, res) => {
    const { userId } = req.user;

    try {
        const travelBlogs = await TravelBlog.find({ userId: userId }).sort({
            isFavourite: -1,
        });
        res.status(200).json({ blogs: travelBlogs });
    } catch (error) {
        res.status(500).json({ error: true, message: error.message });
    }
});

app.put("/edit-blog/:id", authenticateToken, async (req, res) => {
    const { id } = req.params;
    const { title, story, visitedLocation, imageUrl, visitedDate } = req.body;
    const { userId } = req.user;

    if (!title || !story || !visitedLocation || !visitedDate) {
        return res.status(400).json({ error: true, message: "All fields are required" });
    }

    const parsedVisitedDate = new Date(parseInt(visitedDate));

    try {
        const travelBlog = await TravelBlog.findOne({ _id: id, userId: userId });

        if (!travelBlog) {
            return res.status(404).json({ error: true, message: "Travel story not found" });
        }

        const placeholderImgUrl = `https://localhost:8000/assets/placeholder.png`;

        travelBlog.title = title;
        travelBlog.story = story;
        travelBlog.visitedLocation = visitedLocation;
        travelBlog.imageUrl = imageUrl || placeholderImgUrl;
        travelBlog.visitedDate = parsedVisitedDate;
        
        await travelBlog.save();
        res.status(200).json({ story:travelBlog, message:'Update Successful' });
    } catch (error) {
        res.status(500).json({error: true, message: error.message });
    }
});

app.delete("/delete-blog/:id", authenticateToken, async (req, res) => {
    const { id } = req.params;
    const { userId } = req.user;

    try {
        const travelBlog = await TravelBlog.findOne({ _id: id, userId: userId });

        if (!travelBlog) {
            return res.status(404).json({ error: true, message: "Travel story not found" });
        }

        await travelBlog.deleteOne({ _id: id, userId: userId });

        const imageUrl = travelBlog.imageUrl;
        const filename = path.basename(imageUrl);

        const filePath = path.join(__dirname, 'uploads', filename);

        fs.unlink(filePath, (err) => {
            if (err) {
                console.error("Failed to delete image file:", err);
            }
        });

        res.status(200).json({ message: "Travel Blog deleted successfully" });
    } catch (error) {
        res.status(500).json({error: true, message: error.message });
    }
});

app.put("/update-is-favourite/:id", authenticateToken, async (req, res) => {
    const { id } = req.params;
    const { isFavourite } = req.body;
    const { userId } = req.user;

    try {
        const travelBlog = await TravelBlog.findOne({ _id: id, userId: userId });

        if (!travelBlog) {
            return res.status(404).json({ error: true, message: "Travel story not found" });
        }

        travelBlog.isFavourite = isFavourite;

        await travelBlog.save();
        res.status(200).json({ story:travelBlog, message:'Update Successful' });
    } catch (error) {
        res.status(500).json({error: true, message: error.message });
    }
});

app.get("/search", authenticateToken, async (req, res) => {
    const { query } = req.query;
    const { userId } = req.user;

    if (!query ) {
        return res.status(404).json({ error: true, message: "query is required" });
    }

    try {
        const searchResults = await TravelBlog.find({
            userId: userId,
            $or: [
                { title: { $regex: query, $options: "i" } },
                { story: { $regex: query, $options: "i" } },
                { visitedLocation: { $regex: query, $options: "i" } },
            ],
        }).sort({ isFavourite: -1 });

        res.status(200).json({stories: searchResults});
    } catch (error) {
        res.status(500).json({error: true, message: error.message });
    }
});


app.get("/travel-blogs/filter", authenticateToken, async (req, res) => {
    const { startDate, endDate } = req.query;
    const { userId } = req.user;

    try {
        const start = new Date(parseInt(startDate));
        const end = new Date(parseInt(endDate));

        const filteredBlogs = await TravelBlog.find({
            userId: userId,
            visitedDate: { $gte: start, $lte: end },
        }).sort({ isFavourite: -1 });

        res.status(200).json({stories: filteredBlogs});
    } catch (error) {
        res.status(500).json({error: true, message: error.message });
    }
});

app.listen(8000, () => {
    console.log("Server is running on port 8000");
});
