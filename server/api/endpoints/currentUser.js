const { getSdk, handleError } = require('../../api-util/sdk');

module.exports = (req, res) => {
  console.log('Current user request received');

  const sdk = getSdk(req, res);

  sdk.currentUser
    .show()
    .then(response => {
      console.log('Current user response:', response);

      res
        .status(200)
        .json(response)
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
};
