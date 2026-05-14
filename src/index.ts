import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { socketHandler } from './services/socket.service';

import authRoutes from './routes/auth.routes';
import plotRoutes from './routes/plot.routes';
import scheduleRoutes from './routes/schedule.routes';
import diseaseRoutes from './routes/disease.routes';
import notificationRoutes from './routes/notification.routes';
import adminRoutes from './routes/admin.routes';
import productRoutes from './routes/product.routes';

import generalScheduleRoutes from './routes/generalSchedule.routes';
import uploadRoutes from './routes/upload.routes';
import agriMarketRoutes from './routes/agriMarket.routes';
import achievementRoutes from './routes/achievement.routes';
import customerRoutes from './routes/customer.routes';
import billingRoutes from './routes/billing.routes';
import erpPaymentRoutes from './routes/erpPayment.routes';
import reportRoutes from './routes/report.routes';
import stockMovementRoutes from './routes/stockMovement.routes';
import plotAssignmentRoutes from './routes/plotAssignment.routes';

dotenv.config();
process.env.TZ = 'Asia/Kolkata'; // Set Timezone to India Standard Time

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});
const PORT = process.env.PORT || 5002;

// Initialize Socket.io
socketHandler(io);

// Security Middleware
app.use(helmet());

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: 1000, // Increased limit to 1000 to prevent 429 errors in Admin App
    standardHeaders: 'draft-7',
    legacyHeaders: false,
});
app.use(limiter);

app.use(cors());
app.use(express.json({ limit: '1mb' })); // Reduced from 50mb as we use FormData for images
app.use(express.urlencoded({ limit: '1mb', extended: true }));

app.use('/api/auth', authRoutes);
app.use('/api/plots', plotRoutes);
app.use('/api/schedules', scheduleRoutes);
app.use('/api/diseases', diseaseRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/products', productRoutes);

app.use('/api/general-schedules', generalScheduleRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/agri-market', agriMarketRoutes);
app.use('/api/achievements', achievementRoutes);
app.use('/api/blogs', require('./routes/blog.routes').default);
app.use('/api/customers', customerRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/erp-payments', erpPaymentRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/stock-movements', stockMovementRoutes);
app.use('/api/plot-assignments', plotAssignmentRoutes);

import sequelize from './config/database';

// Import new models to ensure sync
import './models/generalSchedule.model';
import './models/generalScheduleItem.model';
import './models/agriMarket.model';
import './models/achievement.model';
import './models/achievementComment.model';
import './models/customer.model';
import './models/invoice.model';
import './models/invoiceItem.model';
import './models/ledgerEntry.model';
import './models/erpPayment.model';
import './models/stockMovement.model';
import './models/plotAssignment.model';

// Sync Database
sequelize.sync({ alter: true }).then(() => {
    console.log('Database connected and synced');
}).catch((err) => {
    console.error('Database sync error:', err);
});

app.get('/', (req, res) => {
    res.send('AgriConsult Pro Backend Running (SQL Mode)');
});

httpServer.listen(PORT as number, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
});
