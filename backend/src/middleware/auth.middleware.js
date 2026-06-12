import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const protectRoute = async (req, res, next) =>{
    try{
        // check user logged in
        const token = req.cookies.jwt;
        if(!token){
            return res.status(401).json({ 
                message: "Unauthoried - no token provided "
            });
        }

        // verify JWT token
        const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);

        if(!decoded){
             return res.status(401).json( {
                message:"Unauthorized - Invalid token"
            });
        }

        // find user from database
        const user = await User.findById(decoded.userId).select("-password");

        if(!user){
            return res.status(401).json({ 
                message: "Unauthorized - User not found" 
            });
        }

        // attach current user you called from db to check to req.user
        req.user = user;

        // goes to the next controller
        next();
    }catch(error){
        console.log("Error in protectedRoute", error);
        res.status(500).json({ message:"Internal Server Error"});
    }
};