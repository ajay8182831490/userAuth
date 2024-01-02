const user = require('../model/userSchema');
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const fetchuser = require('../midleware/fetchuser');

const authAdmin = require('../midleware/authAdmin');
const { body, validationResult } = require('express-validator');



const bcrypt = require('bcrypt');
const { findByIdAndDelete } = require('moongose/models/user_model');

const multer = require('multer');
const path = require('path');

// Set up storage for images
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, './uploads/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const fileExtension = path.extname(file.originalname);
        cb(null, file.fieldname + '-' + uniqueSuffix + fileExtension);
    },
});

const upload = multer({ storage: storage });
// signup,login ,delete,update

router.post('/signup', [
    body('name', 'Enter a name').isLength({ min: 3 }),
    body('email', 'Enter a valid email').isEmail(),

    body('password', 'password must be atleast 5 charecter').isLength({ min: 5 }),

], upload.single('image'), async (req, res, next) => {


    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    let user1 = await user.findOne({ email: req.body.email }, { mobile: req.body.email });


    if (user1) {
        return res.status(400).json({ error: "sorry a with this email is already exist" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashpass = await bcrypt.hash(req.body.password, salt);


    user1 = await user.create({

        name: req.body.name,
        email: req.body.email,
        mobile: req.body.mobile,
        password: hashpass,
        image: req.body.image,
        role: req.body.role

    })
    // now we create a token
    const data = {
        user: {
            id: user1.id,
            role: user1.role
        }
    }

    const token = await jwt.sign(data, process.env.secret);
    res.send({ 'token': token });

})

router.post("/login", [



    body('password', 'password must be atleast 5 charecter').isLength({ min: 5 }),

], async (req, res) => {

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { email, mobile, password } = req.body;
    try {
        if (!email && !mobile) {
            return res.status(400).json({ message: 'Email or phone is required for login' });
        }

        let user1;
        if (email) {

            user1 = await user.findOne({ email });
        }
        if (mobile) {
            user1 = await user.findOne({ mobile });

        }



        if (!user1) {
            res.status(401).send({ error: "please try to login with correct credential" });
        }

        const passwordcompare = await bcrypt.compare(password, user1.password)// password compare here
        if (!passwordcompare) {
            res.status(401).send({ error: "please try to login with correct credential" });

        }

        const data = {
            user1: {
                id: user1.id,
                role: user1.role

            }
        }


        const token = await jwt.sign(data, process.env.secret);
        res.status(200).json({ message: 'Login successful', token });
    }
    catch {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }



})


router.patch('/user/update/:id', fetchuser, upload.single('profileImage'), async (req, res) => {




    const { name, image } = req.body;

    const userId = req.params.id;




    try {
        // Users can only modify their own details
        if (req.user.role === 'User' && req.user.id !== req.params.id) {
            return res.status(403).json({ message: 'Forbidden - User can only modify their own details' });
        }

        // Update user details
        const updatedUser = await user.findByIdAndUpdate(userId, { name, image, }, { new: true }).select("-password");



        if (!updatedUser) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json({ message: 'User details updated successfully', user: updatedUser });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
});




router.delete('/user/:id', fetchuser, async (req, res) => {
    const userId = req.params.id;

    try {
        // Users can only delete their own accounts


        // Delete user account
        const deletedUser = await user.findByIdAndDelete(userId).select("-password");

        if (!deletedUser) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json({ message: 'User account deleted successfully', user: deletedUser });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
});
// Admin
router.get('/admin/userlist', fetchuser, authAdmin, async (req, res, next) => {
    {
        try {

            let userdata = await user.find({ role: "user" }, { password: 0 });
            res.status(201).json(userdata);

        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }
})



router.patch('/admin/user/:id', fetchuser, authAdmin, upload.single('profileImage'), async (req, res, next) => {

    const { name, image } = req.body;
    const userId = req.params.id;



    try {

        const updatedUser = {};

        if (name) {
            updatedUser.name = name;
        }

        if (image) {
            updatedUser.image = image;
        }
        if (!name && !image) {
            res.status(401).json("missing field required");
        }

        const user1 = await user.findByIdAndUpdate(userId, updatedUser, { new: true }).select("-password");


        if (!user1) {
            return res.status(404).json({ message: 'User not found' });
        }

        return res.status(200).json({ message: 'User details updated successfully', user1 });
    }


    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }

})



router.delete('/admin/delete/user/:id', fetchuser, authAdmin, async (req, res, next) => {
    const userId = req.params.id;
    try {
        const user1 = await user.findByIdAndDelete(userId);
        if (!user1) {
            return res.status(404).json({ message: 'User not found' });
        }

        return res.status(200).json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }

})















module.exports = router;
