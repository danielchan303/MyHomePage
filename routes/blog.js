const express = require('express');
const parse = require('node-html-parser').parse;
var xss = require("xss");
const cloudinary = require('cloudinary');
const multer = require('multer');
const cloudinaryStorage = require('multer-storage-cloudinary');

const needAuth = require('../middlewares/needAuth');
const needAdmin = require('../middlewares/needAdmin');

const router = express.Router();
const Blog = require('../models/Blog');
const Comment = require('../models/Comment');

// image storage
const storage = cloudinaryStorage({
    cloudinary: cloudinary,
    folder: '/blog/blog-image',
    transformation: { width: 800, crop: "limit" }
});
const upload = multer({ storage: storage });

// set the active nav item
router.get('*', async (req, res, next) => {
    res.locals.active = 'blog';
    return next();
});

// show all the blog posts
router.get('/', async (req, res) => {
    let blogs;
    const options = {
        select: { title: 1, preview: 1, image: 1, createdAt: 1 },
        sort: { _id: -1 },
        page: req.query.page || 1,
        lean: true,
        limit: 5,
    };
    try {
        // load data for recent blogs
        res.locals.recentBlogs = await Blog.find({}, { title: 1 }, { lean: true }).sort({ _id: -1 }).limit(5);
        // load blogs
        if (req.user && req.user.isAdmin) {
            blogs = await Blog.paginate({}, options);
        } else {
            blogs = await Blog.paginate({ isDraft: false }, options);
        }
        res.render('blog/index', {
            title: "Blog - Daniel's Homepage",
            blogs: blogs.docs, page: blogs.page,
            totalPages: blogs.totalPages, hasPrevPage: blogs.hasPrevPage, hasNextPage: blogs.hasNextPage
        });
    } catch (error) {
        return next(new Error('Internal Error'));
    }
});

router.get('/search', async (req, res) => {
    if (req.query.search) {
        const options = {
            select: { title: 1, preview: 1, image: 1, createdAt: 1 },
            page: req.query.page || 1,
            limit: 5
        };
        const blogs = await Blog.paginate({$text:{$search: req.query.search}}, options);
        res.render('blog/search', {
            title: "Search Result - Daniel's Homepage",
            blogs: blogs.docs, page: blogs.page,
            hasPrevPage: blogs.hasPrevPage, hasNextPage: blogs.hasNextPage});
    } else {
        res.render('blog/search', {
            title: "Search Result - Daniel's Homepage",
            blogs: undefined, page: 0,
            hasPrevPage: false, hasNextPage: false});
    }
});

// show a specific post
router.get('/:blogId', async (req, res, next) => {
    try {
        // find specific blog
        const blog = await Blog.findById(req.params.blogId).populate('comment').lean();
        if (!blog) { return next(new Error('Blog cannot find')); }
        // load data for recent blogs
        res.locals.recentBlogs = await Blog.find({}, { title: 1 }, { lean: true }).sort({ _id: -1 }).limit(5);
        // Load the comments
        const comment = await Comment.paginate({ blogId: req.params.blogId },
            { lean: true, page: req.query.page || 1, limit: 5 });
        res.render('blog/show', { title: "Blog - Daniel's Homepage", blog: blog, comment: comment });
    } catch (error) {
        return next(new Error('Blog cannot find'));
    }
});

// edit a specific post
router.get('/:blogId/edit', needAuth, needAdmin, async (req, res) => {
    const blog = await Blog.findById(req.params.blogId).lean();
    res.render('blog/edit', { title: "Edit Post - Daniel's Homepage", blog: blog });
});

// creat new post
router.post('/', needAuth, needAdmin, async (req, res) => {
    // create new empty blog
    const newBlog = await Blog.create({});
    return res.redirect(`/blog/${newBlog._id}/edit`);
});

// update the blog post
router.put('/:blogId', needAuth, needAdmin, async (req, res, next) => {
    req.body.body = xss(req.body.body);
    // extract first p text
    let preview;
    try {
        preview = xss(req.body.body, {
            whiteList: [], // empty, means filter out all tags
            stripIgnoreTag: true, // filter out all HTML not in the whilelist
            stripIgnoreTagBody: ["script"] // the script tag is a special case, we need
            // to filter out its content
        });
    } catch (error) {
        preview = ""
    }
    // shorten the text for preview
    preview = preview.split(" ").slice(0, 20).join(" ") + "...";
    if (preview.length > 50) {
        preview = preview.substring(0, 47) + "...";
    }
    // save the blog to db
    try {
        await Blog.updateOne({ _id: req.params.blogId },
            { title: req.body.title, body: req.body.body, preview: preview, isDraft: false });
        req.flash('success', 'Blog updated successfully');
        return res.redirect('/blog/' + req.params.blogId);
    } catch (err) {
        return next(err);
    }
});

// delete the blog post
router.delete('/:blogId', needAuth, needAdmin, async (req, res, next) => {
    try {
        await Blog.deleteOne({ _id: req.params.blogId });
        req.flash('success', 'Delete successfully!');
        res.redirect('/blog');
    } catch (error) {
        return next(error);
    }
});

// upload image
router.post('/:blogId/uploadImage', needAuth, needAdmin, async (req, res, next) => {
    try {
        // search for the blog
        const blogExist = await Blog.exists({ _id: req.params.blogId });
        // if the blog cannot be found, throw an error
        if (!blogExist) { throw new Error('Blog not exist'); }
        // go to next middleware if blog found
        return next();
    } catch (error) {
        return next(error);
    }
}, upload.single('file'), async (req, res, next) => {
    try {
        // save the info of the picture to db
        await Blog.updateOne({ _id: req.params.blogId }, {
            '$push': { image: { _id: req.file.public_id, url: req.file.secure_url } }
        });
        // return the info to the tinymce editor
        return res.json({ location: req.file.secure_url, id: req.file.public_id });
    } catch (error) {
        next(error);
    }
});

router.delete('/:blogId/:imageId', needAuth, needAdmin, async (req, res, next) => {
    try {
        // search for the blog
        const blogExist = await Blog.exists({ _id: req.params.blogId });
        // if the blog cannot be found, throw an error
        if (!blogExist) { throw new Error('Blog not exist'); }
        // delete photo from db and cloudinary
        await Blog.updateOne({ _id: req.params.blogId }, { $pull: { image: { _id: req.params.imageId } } });
        cloudinary.v2.uploader.destroy(req.params.imageId, { invalidate: true });
        res.json({ success: true });
    } catch (error) {
        next(error);
    }
});

module.exports = router;