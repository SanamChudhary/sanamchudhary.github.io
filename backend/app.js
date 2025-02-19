import express from 'express';
import { createServer } from 'http';
import mongoose from 'mongoose';
import connectToSocket from './controllers/socket.manager.js';
import cors from 'cors';
import userRoutes from './routes/user.routes.js';
import dotenv from 'dotenv';


const result = dotenv.config();
if (result.error) {
    console.error('Error loading .env file', result.error);
} else {
    console.log('.env file loaded successfully');
}


const app = express();
const server = createServer(app);
const io = connectToSocket(server);

app.use(cors());
app.set('port', process.env.PORT || 8000);
app.use(express.json({limit: '50kb'}));
app.use(express.urlencoded({ limit: '50kb', extended: true }));

app.use('/api/v1/users', userRoutes);

const startServer = async () => {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
        console.error('MONGODB_URI is not defined in the environment variables');
        process.exit(1);
    }

    try {
        await mongoose.connect(mongoUri, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('Connected to MongoDB');

        server.listen(app.get('port'), () => {
            console.log('Server is running on port', app.get('port'));
        });
    } catch (error) {
        console.error('Error connecting to MongoDB', error);
    }
};

startServer();