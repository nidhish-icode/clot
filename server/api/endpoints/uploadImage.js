const { getSdk, handleError } = require('../../api-util/sdk');
const multer = require('multer');

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // Limit to 5MB
});

module.exports = [
  // Multer middleware to handle file upload
  upload.single('image'),
  (req, res) => {
    console.log('Upload image request:', req.file);

    // Basic validation
    if (!req.file) {
      return res.status(400).json({
        error: 'Image file is required',
      });
    }

    const sdk = getSdk(req, res);

    // Upload image using Sharetribe SDK
    sdk.images
      .upload(
        {
          image: req.file,
        },
        { expand: true }
      )
      .then(response => {
        console.log('Image upload response:', response);

        // Extract UUID and image URL
        const imageUuid = response.data.id;
        const imageUrl = response.data.attributes.variants.default.url;

        res
          .status(200)
          .json({
            data: {
              imageUuid,
              imageUrl,
            },
          })
          .end();
      })
      .catch(error => {
        console.error('Image upload error:', {
          message: error.message,
          status: error.status,
          statusText: error.statusText,
          data: error.data,
          code: error.code,
        });
        handleError(res, error);
      });
  },
];
