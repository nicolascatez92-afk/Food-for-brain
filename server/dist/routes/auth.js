"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const uuid_1 = require("uuid");
const database_1 = require("../utils/database");
const auth_1 = require("../middleware/auth");
const errorHandler_1 = require("../middleware/errorHandler");
const router = express_1.default.Router();
// Register with invitation code
router.post('/register', async (req, res, next) => {
    try {
        const { email, username, password, fullName, invitationCode } = req.body;
        if (!email || !username || !password || !invitationCode) {
            return next((0, errorHandler_1.createError)('Email, username, password, and invitation code are required', 400));
        }
        // Verify invitation code
        const invitationResult = await (0, database_1.query)('SELECT * FROM invitations WHERE invitation_code = $1 AND used = false AND expires_at > NOW()', [invitationCode]);
        if (invitationResult.rows.length === 0) {
            return next((0, errorHandler_1.createError)('Invalid or expired invitation code', 400));
        }
        // Check if user already exists
        const existingUser = await (0, database_1.query)('SELECT id FROM users WHERE email = $1 OR username = $2', [email, username]);
        if (existingUser.rows.length > 0) {
            return next((0, errorHandler_1.createError)('User with this email or username already exists', 409));
        }
        // Hash password
        const passwordHash = await bcryptjs_1.default.hash(password, 12);
        // Create user
        const userResult = await (0, database_1.query)(`INSERT INTO users (email, username, password_hash, full_name, is_verified) 
       VALUES ($1, $2, $3, $4, true) RETURNING id, email, username, full_name`, [email, username, passwordHash, fullName]);
        const user = userResult.rows[0];
        // Mark invitation as used
        await (0, database_1.query)('UPDATE invitations SET used = true WHERE invitation_code = $1', [invitationCode]);
        // Generate token
        const token = (0, auth_1.generateToken)({
            id: user.id,
            email: user.email,
            username: user.username
        });
        res.status(201).json({
            message: 'User registered successfully',
            user: {
                id: user.id,
                email: user.email,
                username: user.username,
                fullName: user.full_name
            },
            token
        });
    }
    catch (error) {
        next(error);
    }
});
// Login
router.post('/login', async (req, res, next) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return next((0, errorHandler_1.createError)('Email and password are required', 400));
        }
        // Get user
        const userResult = await (0, database_1.query)('SELECT id, email, username, password_hash, full_name FROM users WHERE email = $1', [email]);
        if (userResult.rows.length === 0) {
            return next((0, errorHandler_1.createError)('Invalid credentials', 401));
        }
        const user = userResult.rows[0];
        // Verify password
        const isValidPassword = await bcryptjs_1.default.compare(password, user.password_hash);
        if (!isValidPassword) {
            return next((0, errorHandler_1.createError)('Invalid credentials', 401));
        }
        // Generate token
        const token = (0, auth_1.generateToken)({
            id: user.id,
            email: user.email,
            username: user.username
        });
        res.json({
            message: 'Login successful',
            user: {
                id: user.id,
                email: user.email,
                username: user.username,
                fullName: user.full_name
            },
            token
        });
    }
    catch (error) {
        next(error);
    }
});
// Create invitation (authenticated users only)
router.post('/invite', async (req, res, next) => {
    try {
        // This would need authentication middleware
        const { email } = req.body;
        if (!email) {
            return next((0, errorHandler_1.createError)('Email is required', 400));
        }
        // Generate invitation code
        const invitationCode = (0, uuid_1.v4)().substring(0, 8).toUpperCase();
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
        // For now, we'll use a dummy inviter ID - in real app this would come from auth middleware
        const inviterId = req.body.inviterId; // This should come from authenticated user
        await (0, database_1.query)('INSERT INTO invitations (email, invited_by, invitation_code, expires_at) VALUES ($1, $2, $3, $4)', [email, inviterId, invitationCode, expiresAt]);
        res.json({
            message: 'Invitation created successfully',
            invitationCode,
            expiresAt
        });
    }
    catch (error) {
        next(error);
    }
});
exports.default = router;
//# sourceMappingURL=auth.js.map