import bcrypt from "bcrypt";
import httpStatus from "http-status";
import { User } from "../models/user.model.js";
import { Meeting } from "../models/meeting.model.js";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();
const JWT_SECRET = process.env.JWT_SECRET;

const login = async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(httpStatus.BAD_REQUEST).json({ message: "Please enter all fields" });
    }

    try {
        const user = await User.findOne({ username });

        if (!user) {
            return res.status(httpStatus.NOT_FOUND).json({ message: "User does not exist" });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(httpStatus.UNAUTHORIZED).json({ message: "Invalid credentials" });
        }

        const token = jwt.sign({ id: user._id, username: user.username }, JWT_SECRET, {
            expiresIn: "1h",
        });

        user.token = token;
        await user.save();

        return res.status(httpStatus.OK).json({ token: token });
    } catch (error) {
        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ message: error.message });
    }
};

const register = async (req, res) => {
    const { name, username, password } = req.body;

    try {
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(httpStatus.CONFLICT).json({ message: "User already exists" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({ name, username, password: hashedPassword });

        await user.save();
        return res.status(httpStatus.CREATED).json({ message: "User registered successfully" });
    } catch (error) {
        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ message: error.message });
    }
};

const verifyToken = (req, res, next) => {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
        return res.status(httpStatus.UNAUTHORIZED).json({ message: "Access denied. No token provided." });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(httpStatus.UNAUTHORIZED).json({ message: "Invalid token." });
    }
};

const getUserHistory = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(httpStatus.NOT_FOUND).json({ message: "User not found" });
        }

        const meetings = await Meeting.find({ user_id: user._id.toString() });
        if (meetings.length === 0) {
            return res.status(httpStatus.NOT_FOUND).json({ message: "No meetings found for this user" });
        }

        return res.json(meetings);
    } catch (err) {
        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ message: `Something went wrong: ${err}` });
    }
};


const addToHistory = async (req, res) => {
    const { meeting_code } = req.body;

    try {
        const user = await User.findOne({ username: req.user.username });
        if (!user) {
            return res.status(httpStatus.NOT_FOUND).json({ message: "User not found" });
        }

        const newMeeting = new Meeting({
            user_id: user._id.toString(),
            meetingCode: meeting_code,
        });

        await newMeeting.save();
        return res.status(httpStatus.CREATED).json({ message: "Added code to history" });
    } catch (err) {
        console.error(err);
        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ message: `Something went wrong: ${err}` });
    }
};


export { login, register, getUserHistory, addToHistory, verifyToken };