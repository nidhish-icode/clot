const tokenRefreshMiddleware = require('./middleware/tokenRefreshMiddleware');
const { getSdk, handleError } = require('../../api-util/sdk');

module.exports = [
  tokenRefreshMiddleware,
  (req, res) => {
    console.log('Logout request received');

    const sdk = getSdk(req, res);

    sdk
      .logout()
      .then(() => {
        console.log('Logout successful');
        res
          .status(200)
          .json({ message: 'Logout successful' })
          .end();
      })
      .catch(error => {
        // Log detailed error for debugging
        console.error('Logout error:', {
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
