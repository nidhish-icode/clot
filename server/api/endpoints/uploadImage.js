const { getSdk, handleError } = require('../../api-util/sdk');
const multer = require('multer');
const FormData = require('form-data'); // For creating multipart/form-data

// Configure multer for file uploads with memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // Limit to 5MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (!allowedTypes.includes(file.mimetype)) {
      return cb(new Error('Only JPEG, PNG, and GIF images are allowed'));
    }
    cb(null, true);
  },
});

module.exports = [
  // Multer middleware to handle file upload
  upload.single('image'),
  async (req, res) => {
    try {
      console.log('Upload image request:', req.file);

      // Basic validation
      if (!req.file) {
        return res.status(400).json({
          error: 'Image file is required',
        });
      }

      // Create a File-like object for logging
      const file = {
        name: req.file.originalname,
        type: req.file.mimetype,
        size: req.file.size,
        buffer: req.file.buffer,
      };

      // Log the file object to ensure correct data
      console.log('File object for upload:', file);

      // Create FormData to mimic frontend File object
      const formData = new FormData();
      formData.append('image', req.file.buffer, {
        filename: req.file.originalname,
        contentType: req.file.mimetype,
      });

      const sdk = getSdk(req, res);

      // Prepare parameters for Sharetribe SDK
      const bodyParams = formData;
      const queryParams = {
        expand: true,
        'fields.image': ['variants.square-small', 'variants.square-small2x', 'variants.default'],
      };

      // Log bodyParams and queryParams for debugging
      console.log('bodyParams (FormData):', {
        filename: req.file.originalname,
        contentType: req.file.mimetype,
        bufferLength: req.file.buffer.length,
      });
      console.log('queryParams:', queryParams);

      // Upload image using Sharetribe SDK
      const response = await sdk.images.upload(bodyParams, queryParams);

      console.log('Image upload response:', response);

      // Validate response
      if (!response?.data?.data?.id || !response?.data?.data?.attributes?.variants?.default?.url) {
        throw new Error('Invalid response structure from image upload');
      }

      // Extract UUID and image URL
      const imageUuid = response.data.data.id;
      const imageUrl = response.data.data.attributes.variants.default.url;

      // Send success response
      res.status(200).json({
        data: {
          imageUuid,
          imageUrl,
        },
      });
    } catch (error) {
      console.error('Image upload error:', {
        message: error.message,
        status: error.status,
        statusText: error.statusText,
        data: error.data,
        code: error.code,
      });
      handleError(res, error);
    }
  },
];
