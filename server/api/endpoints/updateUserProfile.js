const { getSdk, handleError } = require('../../api-util/sdk');
const { body, validationResult } = require('express-validator');
const { v4: isUUID } = require('uuid');

module.exports = [
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

    // Prepare bodyParams for SDK
    const bodyParams = {};

    if (firstName !== undefined) bodyParams.firstName = firstName;
    if (lastName !== undefined) bodyParams.lastName = lastName;
    if (displayName !== undefined) bodyParams.displayName = displayName;
    if (bio !== undefined) bodyParams.bio = bio;
    if (profileImageId !== undefined) {
      bodyParams.profileImageId =
        typeof profileImageId === 'object' && profileImageId.uuid
          ? profileImageId
          : { uuid: profileImageId };
    }
    if (publicData !== undefined) bodyParams.publicData = publicData;
    if (protectedData !== undefined) bodyParams.protectedData = protectedData;
    if (privateData !== undefined) bodyParams.privateData = privateData;

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
