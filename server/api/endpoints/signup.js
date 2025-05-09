const { getSdk, handleError } = require('../../api-util/sdk');

module.exports = (req, res) => {
  console.log('Request body:', req.body);
  const {
    email,
    password,
    firstName,
    lastName,
    displayName,
    bio,
    publicData,
    protectedData,
    privateData,
    ...otherParams
  } = req.body;

  // Basic validation
  if (!email || !password) {
    return res.status(400).json({
      error: 'Email and password are required',
    });
  }

  const sdk = getSdk(req, res);

  // Prepare user creation payload
  const userPayload = {
    email,
    password,
    ...(firstName && { firstName }),
    ...(lastName && { lastName }),
    ...(displayName && { displayName }),
    ...(bio && { bio }),
    ...(publicData && { publicData }),
    ...(protectedData && { protectedData }),
    ...(privateData && { privateData }),
    ...otherParams, // Allow any additional fields
  };

  sdk.currentUser
    .create(userPayload, { expand: true })
    .then(response => {
      console.log('Create user response:', response);

      res
        .status(201)
        .json(response)
        .end();
    })
    .catch(error => {
      // Log detailed error for debugging
      console.error('Create user error:', {
        message: error.message,
        status: error.status,
        statusText: error.statusText,
        data: error.data,
        code: error.code,
      });
      // Handle SDK errors using handleError
      handleError(res, error);
    });
};
