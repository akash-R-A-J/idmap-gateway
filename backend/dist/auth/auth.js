import jwt, {} from "jsonwebtoken";
export const userAuth = async (req, res, next) => {
    const token = req.headers.token;
    if (!token) {
        return res.status(400).json({ message: "invalid request" });
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (!decoded) {
            return res.status(400).json({ message: "invalid token" });
        }
        req.userId = decoded.userId;
        next();
    }
    catch (err) {
        console.error("auth error", err);
        return res.status(401).json({ message: "unauthorized" });
    }
};
//# sourceMappingURL=auth.js.map