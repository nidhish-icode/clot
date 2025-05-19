const login = require('./login');
const signup = require('./signup');
const logout = require('./logout');
const currentUser = require('./currentUser');
const deleteUser = require('./deleteUser');
const uploadImage = require('./uploadImage');
const updateUserProfile = require('./updateUserProfile');
const sendVerificationEmail = require('./sendVerificationEmail');

module.exports = {
  login,
  signup,
  logout,
  currentUser,
  deleteUser,
  uploadImage,
  updateUserProfile,
  sendVerificationEmail,
};
