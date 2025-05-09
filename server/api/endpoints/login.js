const { getSdk, handleError } = require('../../api-util/sdk');

module.exports = (req, res) => {
  console.log('Request body:', req.body);
  const { email, password } = req.body;

  // Basic validation
  if (!email || !password) {
    return res.status(400).json({
      error: 'Email and password are required',
    });
  }

  const sdk = getSdk(req, res);

  sdk
    .login({ username: email, password })
    .then(loginResponse => {
      console.log('Login response:', loginResponse);
      // Fetch current user details
      return sdk.currentUser.show().then(userResponse => ({
        access_token: loginResponse.data.access_token,
        user: userResponse.data,
      }));
    })
    .then(response => {
      res
        .status(200)
        .json(response)
        .end();
    })
    .catch(error => {
      // Log detailed error for debugging
      console.error('Login error:', {
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
