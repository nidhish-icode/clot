const tokenRefreshMiddleware = require('./middleware/tokenRefreshMiddleware');
const { getSdk, handleError } = require('../../api-util/sdk');

module.exports = [
  tokenRefreshMiddleware,
  (req, res) => {
    console.log('Current user request received');

    // Use getSdk with modified request (has Authorization header)
    console.log('req headers passing to sdk', req.headers);
    const sdk = getSdk(req, res);

    sdk.currentUser
      .show({
        expand: true,
        include: ['images', 'profileImage'],
      })
      .then(response => {
        console.log('Current user response:', response);

        // Include new_refresh_token in response
        res
          .status(200)
          .json({
            data: response.data,
            new_refresh_token: res.locals.new_refresh_token,
            expires_in: res.locals.expires_in,
          })
          .end();
      })
      .catch(error => {
        // Log detailed error for debugging
        console.error('Current user error:', {
          message: error.message,
          status: error.status,
          statusText: error.statusText,
          data: error.data,
          code: error.code,
        });
        // Handle SDK errors using handleError
        handleError(res, error);
      });
  },
];
