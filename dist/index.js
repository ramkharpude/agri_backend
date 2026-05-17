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
const plot_routes_1 = __importDefault(require("./routes/plot.routes"));
const schedule_routes_1 = __importDefault(require("./routes/schedule.routes"));
const disease_routes_1 = __importDefault(require("./routes/disease.routes"));
const notification_routes_1 = __importDefault(require("./routes/notification.routes"));
const admin_routes_1 = __importDefault(require("./routes/admin.routes"));
const product_routes_1 = __importDefault(require("./routes/product.routes"));
const generalSchedule_routes_1 = __importDefault(require("./routes/generalSchedule.routes"));
const upload_routes_1 = __importDefault(require("./routes/upload.routes"));
const agriMarket_routes_1 = __importDefault(require("./routes/agriMarket.routes"));
const achievement_routes_1 = __importDefault(require("./routes/achievement.routes"));
const customer_routes_1 = __importDefault(require("./routes/customer.routes"));
const billing_routes_1 = __importDefault(require("./routes/billing.routes"));
const erpPayment_routes_1 = __importDefault(require("./routes/erpPayment.routes"));
const report_routes_1 = __importDefault(require("./routes/report.routes"));
const stockMovement_routes_1 = __importDefault(require("./routes/stockMovement.routes"));
const plotAssignment_routes_1 = __importDefault(require("./routes/plotAssignment.routes"));
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
app.use('/api/auth', auth_routes_1.default);
app.use('/api/plots', plot_routes_1.default);
app.use('/api/schedules', schedule_routes_1.default);
app.use('/api/diseases', disease_routes_1.default);
app.use('/api/notifications', notification_routes_1.default);
app.use('/api/admin', admin_routes_1.default);
app.use('/api/products', product_routes_1.default);
app.use('/api/general-schedules', generalSchedule_routes_1.default);
app.use('/api/upload', upload_routes_1.default);
app.use('/api/agri-market', agriMarket_routes_1.default);
app.use('/api/achievements', achievement_routes_1.default);
app.use('/api/blogs', require('./routes/blog.routes').default);
app.use('/api/customers', customer_routes_1.default);
app.use('/api/billing', billing_routes_1.default);
app.use('/api/erp-payments', erpPayment_routes_1.default);
app.use('/api/reports', report_routes_1.default);
app.use('/api/stock-movements', stockMovement_routes_1.default);
app.use('/api/plot-assignments', plotAssignment_routes_1.default);
const database_1 = __importDefault(require("./config/database"));
// Import new models to ensure sync
require("./models/generalSchedule.model");
require("./models/generalScheduleItem.model");
require("./models/agriMarket.model");
require("./models/achievement.model");
require("./models/achievementComment.model");
require("./models/customer.model");
require("./models/invoice.model");
require("./models/invoiceItem.model");
require("./models/ledgerEntry.model");
require("./models/erpPayment.model");
require("./models/stockMovement.model");
require("./models/plotAssignment.model");
// Sync Database
database_1.default.sync({ alter: true }).then(() => {
    console.log('Database connected and synced');
}).catch((err) => {
    console.error('Database sync error:', err);
});
app.get('/', (req, res) => {
    res.send('AgriConsult Pro Backend Running (SQL Mode)');
});
httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
});
