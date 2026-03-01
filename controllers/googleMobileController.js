import { OAuth2Client } from 'google-auth-library';
import User from '../models/User.js';
import { signToken } from '../utils/jwt.js';
import crypto from 'crypto';

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export const googleMobileController = async (req, res) => {
    try {
        const { idToken, accessToken } = req.body;

        if (!idToken && !accessToken) {
            return res.status(400).json({ isStatus: false, msg: "idToken or accessToken is required" });
        }

        let email, name, picture, googleId;

        if (idToken) {
            try {
                // Verify ID token (standard flow)
                const ticket = await client.verifyIdToken({
                    idToken,
                    audience: [
                        process.env.GOOGLE_CLIENT_ID,
                        process.env.GOOGLE_ANDROID_CLIENT_ID
                    ].filter(Boolean),
                });
                const payload = ticket.getPayload();
                ({ email, name, picture, sub: googleId } = payload);
            } catch (err) {
                if (err.message.includes('Wrong recipient, payload audience != requiredAudience')) {
                    const payloadStr = Buffer.from(idToken.split('.')[1], 'base64').toString();
                    const decodedPayload = JSON.parse(payloadStr);
                    console.error(`\n❌ [Google Auth Error]: Wrong Client ID (Audience Mismatch)`);
                    console.error(`Expected (from .env GOOGLE_CLIENT_ID): ${process.env.GOOGLE_CLIENT_ID}`);
                    console.error(`Received (from token 'aud'):             ${decodedPayload.aud}`);
                    console.error(`\n👉 FIX: In React Native, the idToken's 'aud' is usually your WEB Client ID, not the Android/iOS Client ID.`);
                    console.error(`Please update your backend .env file to use the received 'aud' as your GOOGLE_CLIENT_ID (or use an array of allowed client IDs).\n`);
                    return res.status(401).json({ isStatus: false, msg: "Invalid Google Client ID. Check backend server logs for the correct Client ID to use." });
                }
                throw err;
            }
        } else {
            // Verify access token by calling Google's userinfo endpoint
            const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                headers: { Authorization: `Bearer ${accessToken}` }
            });

            if (!response.ok) {
                return res.status(401).json({ isStatus: false, msg: "Invalid Google access token" });
            }

            const userInfo = await response.json();
            email = userInfo.email;
            name = userInfo.name;
            picture = userInfo.picture;
            googleId = userInfo.sub;
        }

        if (!email) {
            return res.status(400).json({ isStatus: false, msg: "Could not retrieve email from Google" });
        }

        // Find or create user
        let user = await User.findOne({ email });
        let isNewUser = false;

        if (!user) {
            // Brand new Google user — create with needsProfileCompletion = true
            // Role defaults to 'customer' temporarily; will be corrected in complete-profile step
            isNewUser = true;
            user = await User.create({
                full_name: name || email.split('@')[0],
                email,
                isVerified: true,
                profile_photo_url: picture,
                authType: 'google',
                role: 'customer',  // temporary, will be updated in complete-profile
                googleId: googleId,
                needsProfileCompletion: true,
            });
        } else {
            if (!user.isVerified) {
                user.isVerified = true;
                // Fix: Account Takeover Loophole.
                // If a malicious user registered with this email, their password hash might be known to them.
                // We must wipe the password since they are now verified by Google.
                user.password = crypto.randomBytes(32).toString('hex');
                await user.save();
            }
            if (user.googleId !== googleId) {
                user.googleId = googleId;
                await user.save();
            }
        }

        // Sign our own JWT
        const token = signToken({
            id: user._id,
            email: user.email,
            role: user.role
        });

        const needsCompletion = user.needsProfileCompletion || !user.phone_number || !user.address || !user.gender || !user.age;

        res.status(200).json({
            isStatus: true,
            msg: needsCompletion ? "Google Login successful – profile completion required" : "Google Login successful",
            data: {
                user: {
                    id: user._id,
                    email: user.email,
                    full_name: user.full_name,
                    role: user.role,
                    profile_photo_url: user.profile_photo_url,
                    needsProfileCompletion: needsCompletion,
                },
                token
            }
        });

    } catch (error) {
        console.error("Google Mobile Auth Error:", error);
        res.status(500).json({ isStatus: false, msg: "Internal Server Error" });
    }
};
