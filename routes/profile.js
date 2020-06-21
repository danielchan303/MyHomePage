const express = require('express');
const router = express.Router();
const needAuth = require('../middlewares/needAuth');
const User = require('../models/User');

const multer = require('multer');
const cloudinary = require('cloudinary');
const cloudinaryStorage = require('multer-storage-cloudinary');

// image storage
const storage = cloudinaryStorage({
    cloudinary: cloudinary,
    folder: '/blog/profile-image',
    transformation: { width: 300, crop: "limit" }
});
const upload = multer({ storage: storage });

router.get('/', needAuth, (req, res) => {
    res.render('profile', { title: "Profile - Daniel's Homepage" });
});

router.get('/edit', needAuth, (req, res) => {
    res.render('profile/edit', { title: "Edit Profile - Daniel's Homepage" });
});

router.post('/', needAuth, upload.single('profileImage'), async (req, res) => {
    const updatedUser = {
        email: req.body.email,
        displayName: req.body.displayName
    };

    if (req.file) {
        // if previously have a picture, delete it
        if (req.user.profileImage) {
            cloudinary.v2.uploader.destroy(req.user.profileImage._id, { invalidate: true });
        }
        // send it to database
        updatedUser.profileImage = {_id: req.file.public_id, url: req.file.secure_url};
    }

    try {
        const response = await User.updateOne({_id: req.user._id}, updatedUser);
        if (!response.ok) {
            throw new error('Internal error');
        }
        req.flash('success', 'Profile successfully updated!');
        res.redirect('back');
    } catch (error) {
        return next(error);
    }
});

module.exports = router;