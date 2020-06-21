const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const mongoosePaginate = require('mongoose-paginate-v2');
const cloudinary = require('cloudinary').v2;
const Comment = require('./Comment');

const imageSchema = new Schema({
    _id: { type: String, required: true },
    url: { type: String, required: true }
});

const blogSchema = new Schema({
    title: { type: String, default: 'No title' },
    preview: { type: String },
    body: { type: String, default: '' },
    image: [imageSchema],
    isDraft: { type: Boolean, default: true }
}, { timestamps: { createdAt: 'createdAt' } });

blogSchema.plugin(mongoosePaginate);

blogSchema.pre("deleteOne", async function (next) {
    const docToDelete = await this.model.findOne(this.getQuery(), { lean: true });

    if (!docToDelete) {
        return next(new Error('Blog cannot be found'));
    }

    // delete related image before delete the blog
    const request = [];
    if (docToDelete.image) {
        docToDelete.image.forEach(image => {
            request.push(cloudinary.uploader.destroy(image._id, { invalidate: true }) );
        });
    }
    
    // delete the comments before delete the blog
    request.push(Comment.deleteMany({ blogId: docToDelete._id }) );

    try {
        await Promise.all(request)
    } catch (error) {
        return next(error);
    }
});

module.exports = mongoose.model('Blog', blogSchema);