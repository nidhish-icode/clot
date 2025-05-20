const axios = require('axios');
const qs = require('querystring');
const { handleError } = require('../../../api-util/sdk');

// Environment variables
const CLIENT_ID = process.env.REACT_APP_SHARETRIBE_SDK_CLIENT_ID;
const CLIENT_SECRET = process.env.SHARETRIBE_SDK_CLIENT_SECRET;
const TOKEN_URL = 'https://flex-api.sharetribe.com/v1/auth/token';

// Middleware to handle token refresh and simulate cookie for getSdk
const tokenRefreshMiddleware = async (req, res, next) => {
  try {
    // Log request for debugging
    console.log('Request headers:', req.headers);
    console.log('Request body (for reference):', req.body);

    // Extract refresh_token from request headers (case-insensitive)
    const refresh_token = req.headers['x-refresh-token'] || req.headers['X-Refresh-Token'];

    console.log('Extracted refresh_token from headers:', refresh_token);

    if (!refresh_token) {
      console.error('No refresh_token found in headers (X-Refresh-Token)');
      return res.status(400).json({ error: 'refresh_token is required in X-Refresh-Token header' });
    }

    // Check client_secret
    if (!CLIENT_SECRET) {
      console.warn('CLIENT_SECRET is not set in environment variables');
    }

    // Prepare body for Sharetribe /v1/auth/token
    const body = {
      client_id: CLIENT_ID,
      grant_type: 'refresh_token',
      refresh_token,
      scope: 'user',
      ...(CLIENT_SECRET && { client_secret: CLIENT_SECRET }), // Conditionally include
    };

    console.log('Sharetribe auth body:', body);

    // Make HTTP POST call to Sharetribe
    const response = await axios.post(TOKEN_URL, qs.stringify(body), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8',
        Accept: 'application/json',
      },
    });

    console.log('Sharetribe auth response:', response.data);

    // Extract tokens from response
    const {
      access_token,
      refresh_token: new_refresh_token,
      expires_in,
      scope,
      token_type,
    } = response.data;

    if (!access_token) {
      console.error('No access_token in Sharetribe response');
      return res.status(500).json({ error: 'Failed to obtain access_token' });
    }

    // Create token object for cookie
    const tokenObject = {
      access_token,
      refresh_token: new_refresh_token || refresh_token,
      scope,
      token_type,
      expires_in,
    };

    // JSON-encode token object (NO URL encoding)
    const tokenString = JSON.stringify(tokenObject);

    // Simulate cookie for getSdk (st-<client_id>-token)
    const cookieKey = `st-${CLIENT_ID}-token`;
    req.cookies = req.cookies || {};
    req.cookies[cookieKey] = tokenString;

    // Set cookie header for fallback (NO URL encoding)
    const cookieString = `${cookieKey}=${tokenString}`;
    req.headers['cookie'] = req.headers['cookie']
      ? `${req.headers['cookie']}; ${cookieString}`
      : cookieString;

    console.log('Set cookie:', req.cookies);
    console.log('Set cookie header:', req.headers['cookie']);

    // Store new refresh_token (if provided) for response
    res.locals.new_refresh_token = new_refresh_token || refresh_token;
    res.locals.expires_in = expires_in;

    // Proceed to next middleware/route
    next();
  } catch (error) {
    console.error('Token refresh error:', {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
    });

    // Handle errors using handleError
    handleError(res, {
      status: error.response?.status || 500,
      statusText: error.response?.statusText || 'Internal Server Error',
      data: error.response?.data || { error: error.message },
    });
  }
};

module.exports = tokenRefreshMiddleware;
