const { getSdk, handleError } = require('../../api-util/sdk');
const { body, validationResult } = require('express-validator');
const { v4: isUUID } = require('uuid');
const tokenRefreshMiddleware = require('./middleware/tokenRefreshMiddleware');

// Middleware to parse and sanitize request body
const sanitizeBody = (req, res, next) => {
  // If no body or empty object, proceed with empty body
  if (!req.body || Object.keys(req.body).length === 0) {
    req.body = {};
    return next();
  }

  try {
    // Clean the body: remove undefined, null, empty strings, or invalid fields
    const cleanedBody = {};
    for (const [key, value] of Object.entries(req.body)) {
      // Skip if value is undefined, null, or empty string (except for bio, which we handle later)
      if (
        value === undefined ||
        value === null ||
        (typeof value === 'string' && value.trim() === '' && key !== 'bio')
      ) {
        continue;
      }
      // For objects (e.g., protectedData), only include if they have non-empty keys
      if (typeof value === 'object' && value !== null && Object.keys(value).length > 0) {
        cleanedBody[key] = value;
      } else if (typeof value !== 'object') {
        cleanedBody[key] = value;
      }
    }
    req.body = cleanedBody;
    next();
  } catch (error) {
    console.error('Body sanitization error:', error);
    return res
      .status(400)
      .json({ errors: [{ msg: 'Invalid JSON body. Please ensure all fields are valid.' }] });
  }
};

module.exports = [
  // Token refresh middleware
  tokenRefreshMiddleware,

  // Sanitize body before validation
  sanitizeBody,

  // Validation middleware
  body('firstName')
    .optional()
    .isString()
    .notEmpty()
    .withMessage('firstName must be a non-empty string'),
  body('lastName')
    .optional()
    .isString()
    .notEmpty()
    .withMessage('lastName must be a non-empty string'),
  body('displayName')
    .optional()
    .isString()
    .withMessage('displayName must be a string'),
  body('bio')
    .optional({ nullable: true })
    .isString()
    .isLength({ max: 5000 })
    .withMessage('bio must be a string with max 5000 characters'),
  body('profileImageId')
    .optional({ nullable: true })
    .custom(value => {
      if (value === null) return true;
      if (typeof value === 'object' && value.uuid && isUUID(value.uuid)) return true;
      if (isUUID(value)) return true;
      throw new Error('profileImageId must be a valid UUID or null');
    }),
  body('publicData')
    .optional()
    .isObject()
    .withMessage('publicData must be an object')
    .custom(value => {
      const size = Buffer.byteLength(JSON.stringify(value), 'utf8');
      if (size > 50 * 1024) {
        throw new Error('publicData must not exceed 50KB');
      }
      return true;
    }),
  body('protectedData')
    .optional()
    .isObject()
    .withMessage('protectedData must be an object')
    .custom(value => {
      const size = Buffer.byteLength(JSON.stringify(value), 'utf8');
      if (size > 50 * 1024) {
        throw new Error('protectedData must not exceed 50KB');
      }
      return true;
    }),
  body('privateData')
    .optional()
    .isObject()
    .withMessage('privateData must be an object')
    .custom(value => {
      const size = Buffer.byteLength(JSON.stringify(value), 'utf8');
      if (size > 50 * 1024) {
        throw new Error('privateData must not exceed 50KB');
      }
      return true;
    }),

  // Main endpoint handler
  (req, res) => {
    console.log('Update profile request received:', req.body);

    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.error('Validation errors:', errors.array());
      return res.status(400).json({ errors: errors.array() });
    }

    const sdk = getSdk(req, res);

    // Extract body parameters
    const {
      firstName,
      lastName,
      displayName,
      bio,
      profileImageId,
      publicData,
      protectedData,
      privateData,
    } = req.body;

    // Prepare bodyParams for SDK, only include defined and non-empty values
    const bodyParams = {};

    if (firstName && firstName.trim()) bodyParams.firstName = firstName.trim();
    if (lastName && lastName.trim()) bodyParams.lastName = lastName.trim();
    if (displayName && displayName.trim()) bodyParams.displayName = displayName.trim();
    // Only include bio if it's a non-empty string or explicitly null
    if (bio !== undefined && bio !== null && (bio.trim() || bio === null)) {
      bodyParams.bio = bio;
    }
    if (profileImageId !== undefined && profileImageId !== null) {
      bodyParams.profileImageId =
        typeof profileImageId === 'object' && profileImageId.uuid
          ? profileImageId
          : { uuid: profileImageId };
    }
    if (publicData && Object.keys(publicData).length > 0) bodyParams.publicData = publicData;
    if (protectedData && Object.keys(protectedData).length > 0)
      bodyParams.protectedData = protectedData;
    if (privateData && Object.keys(privateData).length > 0) bodyParams.privateData = privateData;

    // If no valid params, return early with current user data
    if (Object.keys(bodyParams).length === 0) {
      console.log('No valid parameters provided, returning current user');
      return sdk.currentUser
        .show()
        .then(response => {
          const userData = response.data.data;
          res.status(200).json({
            data: {
              id: userData.id,
              firstName: userData.attributes.profile.firstName,
              lastName: userData.attributes.profile.lastName,
              displayName: userData.attributes.profile.displayName,
              bio: userData.attributes.profile.bio,
              publicData: userData.attributes.profile.publicData,
              protectedData: userData.attributes.profile.protectedData,
              privateData: userData.attributes.profile.privateData,
              profileImage: null, // Simplified, as no image update
            },
            new_refresh_token: res.locals.new_refresh_token,
            expires_in: res.locals.expires_in,
          });
        })
        .catch(error => {
          console.error('Current user fetch error:', error);
          handleError(res, error);
        });
    }

    // Query parameters
    console.log('bodyparams uploading', bodyParams);
    const queryParams = {
      expand: true,
      include: ['profileImage'],
      'fields.image': ['variants.square-small', 'variants.square-small2x', 'variants.default'],
    };

    // Call Sharetribe SDK
    sdk.currentUser
      .updateProfile(bodyParams, queryParams)
      .then(response => {
        console.log('Update profile response:', response);

        // Validate response
        if (!response?.data?.data?.id) {
          throw new Error('Invalid response structure from updateProfile');
        }

        // Extract relevant data
        const userData = response.data.data;
        const profileImage = response.data.included?.find(item => item.type === 'image');

        // Send response
        res.status(200).json({
          data: {
            id: userData.id,
            firstName: userData.attributes.profile.firstName,
            lastName: userData.attributes.profile.lastName,
            displayName: userData.attributes.profile.displayName,
            bio: userData.attributes.profile.bio,
            publicData: userData.attributes.profile.publicData,
            protectedData: userData.attributes.profile.protectedData,
            privateData: userData.attributes.profile.privateData,
            profileImage: profileImage
              ? {
                  id: profileImage.id,
                  url: profileImage.attributes.variants?.default?.url,
                }
              : null,
          },
          new_refresh_token: res.locals.new_refresh_token,
          expires_in: res.locals.expires_in,
        });
      })
      .catch(error => {
        console.error('Update profile error:', {
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
