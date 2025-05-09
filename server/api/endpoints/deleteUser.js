const { getSdk, handleError } = require('../../api-util/sdk');

module.exports = (req, res) => {
  console.log('Delete user request received:', req.body);
  const { currentPassword } = req.body;

  // Basic validation
  if (!currentPassword) {
    return res.status(400).json({
      error: 'Current password is required',
    });
  }

  const sdk = getSdk(req, res);

  sdk.currentUser
    .delete({ currentPassword }, { expand: true })
    .then(response => {
      console.log('Delete user response:', response);
      // Return complete response.data as JSON
      res
        .status(200)
        .json(response.data)
        .end();
    })
    .catch(error => {
      // Log detailed error for debugging
      console.error('Delete user error:', {
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
