const express = require('express');
const router = express.Router({mergeParams: true});

const Blog = require('../models/Blog');
const Comment = require('../models/Comment');

const recapcha = require('../middlewares/recaptcha');
const needAuth = require('../middlewares/needAuth');
const needEmailVerified = require('../middlewares/needEmailVerified');

router.post('/comment', needAuth, needEmailVerified, recapcha, async (req, res, next) => {
    try {
        const blogExist = await Blog.exists({_id: req.params.blogId});

        if (blogExist) {
            const newComment = {
                blogId: req.params.blogId,
                userId: req.user.id, 
                userImg: req.user.profileImage ? req.user.profileImage.url : undefined,
                displayName: req.user.displayName,
                body: req.body.comment
            };
            await Comment.create(newComment);
        }
        res.redirect(req.get('Referrer') + '#comment');
    } catch (error) {
        next(error);
    }
});

module.exports = router;