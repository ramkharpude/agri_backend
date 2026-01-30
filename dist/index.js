"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const dotenv_1 = __importDefault(require("dotenv"));
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const socket_service_1 = require("./services/socket.service");
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const consultation_routes_1 = __importDefault(require("./routes/consultation.routes"));
const plot_routes_1 = __importDefault(require("./routes/plot.routes"));
const schedule_routes_1 = __importDefault(require("./routes/schedule.routes"));
const disease_routes_1 = __importDefault(require("./routes/disease.routes"));
const notification_routes_1 = __importDefault(require("./routes/notification.routes"));
const admin_routes_1 = __importDefault(require("./routes/admin.routes"));
const product_routes_1 = __importDefault(require("./routes/product.routes"));
const order_routes_1 = __importDefault(require("./routes/order.routes"));
dotenv_1.default.config();
process.env.TZ = 'Asia/Kolkata'; // Set Timezone to India Standard Time
const app = (0, express_1.default)();
const httpServer = (0, http_1.createServer)(app);
const io = new socket_io_1.Server(httpServer, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});
const PORT = process.env.PORT || 5002;
// Initialize Socket.io
(0, socket_service_1.socketHandler)(io);
// Security Middleware
app.use((0, helmet_1.default)());
const limiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: 1000, // Increased limit to 1000 to prevent 429 errors in Admin App
    standardHeaders: 'draft-7',
    legacyHeaders: false,
});
app.use(limiter);
app.use((0, cors_1.default)());
app.use(express_1.default.json({ limit: '1mb' })); // Reduced from 50mb as we use FormData for images
app.use(express_1.default.urlencoded({ limit: '1mb', extended: true }));
// Request Logger
app.use((req, res, next) => {
    res.on('finish', () => {
        // console.log(`${req.method} ${req.originalUrl} - ${res.statusCode}`);
    });
    next();
});
app.use('/api/auth', auth_routes_1.default);
app.use('/api/consultations', consultation_routes_1.default);
app.use('/api/plots', plot_routes_1.default);
app.use('/api/schedules', schedule_routes_1.default);
app.use('/api/diseases', disease_routes_1.default);
app.use('/api/notifications', notification_routes_1.default);
app.use('/api/admin', admin_routes_1.default);
app.use('/api/products', product_routes_1.default);
app.use('/api/products', product_routes_1.default);
app.use('/api/orders', order_routes_1.default);
app.use('/api/blogs', require('./routes/blog.routes').default);
const database_1 = __importDefault(require("./config/database"));
// Sync Database
database_1.default.sync({ alter: true }).then(() => {
    // console.log('SQLite Database connected and synced');
}).catch((err) => {
    console.error('Database sync error:', err);
});
app.get('/', (req, res) => {
    res.send('AgriConsult Pro Backend Running (SQL Mode)');
});
httpServer.listen(PORT, '0.0.0.0', () => {
    // console.log(`Server running on port ${PORT}`);
});
