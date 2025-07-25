const jwt = require('jsonwebtoken');

function authenticateToken(req, res, next) {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1]; // Get token part from 'Bearer <token>'

    console.log("Authorization Header:", authHeader);  // Log the Authorization header

    if (!token) {
        return res.sendStatus(401);  // If no token, send Unauthorized
    }

    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
        if (err) {
            console.log("JWT Verification Error:", err);  // Log the error if JWT is invalid
            return res.sendStatus(401);  // Unauthorized if token is invalid
        }

        console.log("Decoded User:", user);  // Log the decoded user object

        req.user = user;  // Attach the user data to the request
        next();  // Proceed to the next middleware or route handler
    });
}

module.exports = {
    authenticateToken,
};
