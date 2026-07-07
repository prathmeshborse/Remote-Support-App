// File path: server/utils/uploadToCloudinary.js

const cloudinary = require("cloudinary").v2;

exports.uploadToCloudinary = async (file, folder, quality, resourceType) => {
    const options = {
        folder,
        resource_type: resourceType,
    };

    if (quality) {
        options.quality = quality;
    } else {
        options.quality = "auto";
    }

    // Pro-Tip: For large videos, Cloudinary performs better with chunk_size
    if (resourceType === "video") {
        options.chunk_size = 6000000; // 6MB chunks avoids buffer timeouts during network uploads.
    }

    return await cloudinary.uploader.upload(
        file.tempFilePath,
        options
    );
};