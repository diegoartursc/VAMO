import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import authRoutes from './routes/auth';
import packageRoutes from './routes/packages';
import itineraryRoutes from './routes/itineraries';
import creatorRoutes from './routes/creators';
import destinationRoutes from './routes/destinations';
import reviewRoutes from './routes/reviews';
import myTripsRoutes from './routes/my-trips';
import adminRoutes from './routes/admin';
import departureRoutes from './routes/departures';
import salesRoutes from './routes/sales';
import flightQuoteRoutes from './routes/flight-quotes';
import agencyDocRoutes from './routes/agency-documents';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3333;

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
});

// Middleware
app.use(cors());
app.use(express.json());
app.use('/api', limiter);

// Serve static files from public/uploads
import path from 'path';
app.use('/uploads', express.static(path.join(process.cwd(), 'public/uploads')));

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.get('/api', (req, res) => {
    res.json({
        message: 'VAMO Agency Management API',
        version: '1.0.0'
    });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/packages', packageRoutes);
app.use('/api/itineraries', itineraryRoutes);
app.use('/api/creators', creatorRoutes);
app.use('/api/destinations', destinationRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/my-trips', myTripsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/departures', departureRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/quotes', flightQuoteRoutes);
app.use('/api/agency-docs', agencyDocRoutes);

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error(err.stack);
    res.status(500).json({
        error: 'Something went wrong!',
        message: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
});

export default app;
