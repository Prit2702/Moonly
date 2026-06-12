import User from "../models/User.js";
import jwt from "jsonwebtoken"

export async function signup(req, res){
    const {email,password,fullName}  = req.body;

    try {
        if(!email || !password || !fullName){
            return res.status(400).json({ message: "All fields are required" });
        }
        if(password.length < 6){
            return res.status(400).json({ message: "Password must be atleast 6 characters"});
        }
        
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if(!emailRegex.test(email)){
            return res.status(400).json({ message: "Invalid email address"});
        }

        const existingUser = await User.findOne({ email });
        if(existingUser){
            return res.status(400).json({ message: "Email already exists, please use a different email."})
        }

        // avatar profile
        const idx =  Math.floor(Math.random()*100) + 1; // geenrate a num betweeen 1-100
        const randomAvatar = `https://avatar.iran.liara.run/public/${idx}.png`;

        // create new account
        const newUser = await User.create({
            email,
            fullName,
            password,
            profilePic: randomAvatar,
        })

        // JWT token  create
        const token = jwt.sign( {userId:newUser._id}, process.env.JWT_SECRET_KEY, {
            expiresIn: "7d"
        })

        // browser storage of token
        res.cookie("jwt", token, {
            maxAge : 7*24*60*60*1000,
            httpOnly: true, // prevents XSS attack
            sameSite: "Strict",  // prevents CSRF attack
            secure: process.env.NODE_ENV === "production"
        })

        res.status(201).json({
            success:true, 
            user:newUser
        });

    } catch (error) {
        console.log("Error in signup controller");
        res.status(500).json({ message: "Internal Server Error" });
    }
}

export async function login(req, res){
    try{
        const { email, password } = req.body;

        // if input valid
        if(!email || !password){
            return res.status(400).json({ message: "All fields are required" });
        }

        // email from database
        const user = await User.findOne({ email });
        if(!user) return res.status(401).json({ message: "invalid email or password" });

        // password from database
        const isPasswordCorrect = await user.matchPassword(password);
        if(!isPasswordCorrect) return res.status(401).json({ message: "Invalid email or password" });

        // token create
        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET_KEY, {
            expiresIn: "7d",
        });

        // browser storage
        res.cookie("jwt", token, {
            maxAge: 7*24*60*60*1000,
            httpOnly: true,
            sameSite: "strict",
            secure: process.env.NODE_ENV === "production",
        });
        res.status(200).json({ success:true, user })    
    }catch(error){
        console.log("Error in login controller", error.message);
        res.status(500).json({ message: "Internal Server Error" });
    }
}

export function logout(req, res){
    // clear browser jwt storage
    res.clearCookie("jwt");
    res.status(200).json({ success:true, message:"Logout successful"});
}

export async function onboard(req, res) {
    try{
        const userId = req.user._id;

        const { fullName, bio, nativeLanguage, learningLanguage, location } = req.body;

        // input
        if(!fullname || !bio || ! nativeLanguage || !learningLanguage || !location){
            return res.status(401).jaon({ 
                message: "All fields are required",
                misingFields: [
                    !fullName && "fullNmame",
                    !bio && "bio",
                    !nativeLanguage && "nativeLanguage",
                    !learningLanguage && "learningLanguage",
                    !location && "location",
                ].filter(Boolean),
            })  ;      
        }

        // update info from database
        const updatedUser = await findByIdAndUpdate(
            userId,
            {
                ...req.body,
                isOnboard: true,
            },
            { new: true}
        );

        if(!updatedUser) {
            return res.status(400).json({ message: "User not found" });
        }
        try{
            // create/update stream chat user
            await upsertStreamUser({
                id: updateduser._id.toString(),
                name: updatedUser.fullName,
                image: updatedUser.profilePic || "",
            });
            console.log(`Stream User updated after onBoarding for ${updatedUser.fullNmame}`);
        }catch(streamError){
            console.log("error updating stream user during onboarding:", streamError.message);
        }

        // send updated user back to frontend
        res.status(200).json({ success: true, user: updatedUser });
    }catch(error){
        console.error('Onboarding error:', error);
        res.status(400).json({ message: "Internal Server Error"  });
    }
}