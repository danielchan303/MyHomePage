const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');
const Schema = mongoose.Schema;

const commentSchema = new Schema({
    blogId: {type: mongoose.Schema.Types.ObjectId, required: true},
    userId: {type: mongoose.Schema.Types.ObjectId, required: true},
    userImg: {type: String, default: '/images/profile_img_b.svg'},
    displayName: {type: String, required: true},
    body: {type: String, trim: true, required: true}
}, { timestamps: { createdAt: 'createdAt' } });

commentSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('Comment', commentSchema);