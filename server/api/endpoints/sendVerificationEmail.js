const { getSdk, handleError } = require('../../api-util/sdk');
const tokenRefreshMiddleware = require('./middleware/tokenRefreshMiddleware');

module.exports = [
  // Token refresh middleware
  tokenRefreshMiddleware,

  // Main endpoint handler
  (req, res) => {
    console.log('Send verification email request received');

    const sdk = getSdk(req, res);

    sdk.currentUser
      .sendVerificationEmail()
      .then(response => {
        console.log('Send verification email response:', response);

        // Validate response
        if (!response?.data?.data?.id) {
          throw new Error('Invalid response structure from sendVerificationEmail');
        }

        // Send response
        res.status(200).json({
          data: response.data,
          new_refresh_token: res.locals.new_refresh_token,
          expires_in: res.locals.expires_in,
        });
      })
      .catch(error => {
        console.error('Send verification email error:', {
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
