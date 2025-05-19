# Sharetribe API Documentation

This document details the API endpoints for the Sharetribe integration used in the FlutterFlow application. These APIs handle user authentication, profile management, and image uploads, powered by the Sharetribe SDK. All endpoints are secured and require appropriate authentication where specified.

## Table of Contents

- [Base URL](#base-url)
- [Authentication](#authentication)
- [Endpoints](#endpoints)
  - [1. Login](#1-login)
  - [2. Create User](#2-create-user)
  - [3. Logout](#3-logout)
  - [4. Get Current User](#4-get-current-user)
  - [5. Delete User](#5-delete-user)
  - [6. Upload Image](#6-upload-image)
  - [7. Update User Profile](#7-update-user-profile)
  - [8. Send Verification Email](#8-send-verification-email)
- [Error Handling](#error-handling)
- [Notes](#notes)
- [Contact](#contact)

## Base URL

```
https://your-backend.com/api
```

## Authentication

Most endpoints require an `Authorization` header with a Bearer token obtained from Sharetribe’s OAuth flow (via `/login` or `/create-user`). Endpoints using `tokenRefreshMiddleware` (`getcurrentuser`, `logout`, `deleteuser`, `uploadimg`, `update-profile`, `sendverificationemail`) also require an `X-Refresh-Token` header with the refresh token.

### Headers

- **For `/login` and `/create-user`**:
  ```http
  Content-Type: application/json
  ```

- **For all other endpoints**:
  ```http
  Content-Type: application/json
  Authorization: Bearer <access_token>
  X-Refresh-Token: <refresh_token>
  ```
  - **Exception**: `/uploadimg` uses `Content-Type: multipart/form-data`.

### Token Refresh

- Endpoints using `tokenRefreshMiddleware` return `new_refresh_token` and `expires_in` in responses if the token is refreshed.
- Clients must update the stored token with `new_refresh_token` to maintain session continuity.
- The `X-Refresh-Token` header is mandatory for these endpoints to validate and refresh the session.

## Endpoints

### 1. Login

Authenticates a user and returns an access token, refresh token, and user details.

- **Endpoint**: `POST /login`
- **Headers**:
  ```http
  Content-Type: application/json
  ```
- **Request Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "password123"
  }
  ```
  - `email` (string, required): User’s email address.
  - `password` (string, required): User’s password.
- **Example Request**:
  ```bash
  curl -X POST https://your-backend.com/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'
  ```
- **Response**:
  - **Status**: `200 OK`
  - **Body**:
    ```json
    {
      "access_token": "<jwt_token>",
      "refresh_token": "<refresh_token>",
      "user": {
        "data": {
          "id": "<uuid>",
          "type": "currentUser",
          "attributes": {
            "email": "user@example.com",
            "emailVerified": false,
            "profile": {
              "firstName": "John",
              "lastName": "Doe",
              "displayName": "JohnDoe",
              "bio": "About me",
              "publicData": {},
              "protectedData": {
                "phoneNumber": "+91-8862898972"
              },
              "privateData": {}
            }
          }
        }
      }
    }
    ```
- **Errors**:
  - `400 Bad Request`: Missing email or password.
    ```json
    { "error": "Email and password are required" }
    ```
  - `401 Unauthorized`: Invalid credentials.
  - `500 Internal Server Error`: Server-side issue.

### 2. Create User

Creates a new user account.

- **Endpoint**: `POST /create-user`
- **Headers**:
  ```http
  Content-Type: application/json
  ```
- **Request Body**:
  ```json
  {
    "email": "newuser@example.com",
    "password": "password123",
    "firstName": "Jane",
    "lastName": "Doe",
    "displayName": "JaneDoe",
    "bio": "New user",
    "protectedData": {
      "phoneNumber": "+91-8862898972"
    }
  }
  ```
  - `email` (string, required): User’s email address.
  - `password` (string, required): User’s password.
  - `firstName` (string, optional): User’s first name.
  - `lastName` (string, optional): User’s last name.
  - `displayName` (string, optional): User’s display name.
  - `bio` (string, optional): User’s bio.
  - `publicData` (object, optional): Public user data.
  - `protectedData` (object, optional): Protected user data (e.g., phone number).
  - `privateData` (object, optional): Private user data.
- **Example Request**:
  ```bash
  curl -X POST https://your-backend.com/api/create-user \
  -H "Content-Type: application/json" \
  -d '{"email":"newuser@example.com","password":"password123","firstName":"Jane","protectedData":{"phoneNumber":"+91-8862898972"}}'
  ```
- **Response**:
  - **Status**: `201 Created`
  - **Body**:
    ```json
    {
      "data": {
        "id": "<uuid>",
        "type": "currentUser",
        "attributes": {
          "email": "newuser@example.com",
          "emailVerified": false,
          "profile": {
            "firstName": "Jane",
            "lastName": null,
            "displayName": null,
            "bio": null,
            "publicData": {},
            "protectedData": {
              "phoneNumber": "+91-8862898972"
            },
            "privateData": {}
          }
        }
      }
    }
    ```
- **Errors**:
  - `400 Bad Request`: Missing email or password.
    ```json
    { "error": "Email and password are required" }
    ```
  - `409 Conflict`: Email already exists.
  - `500 Internal Server Error`: Server-side issue.

### 3. Logout

Logs out the current user, invalidating the access token.

- **Endpoint**: `POST /logout`
- **Headers**:
  ```http
  Content-Type: application/json
  Authorization: Bearer <access_token>
  X-Refresh-Token: <refresh_token>
  ```
- **Request Body**: Empty (`{}`)
- **Example Request**:
  ```bash
  curl -X POST https://your-backend.com/api/logout \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <access_token>" \
  -H "X-Refresh-Token: <refresh_token>" \
  -d '{}'
  ```
- **Response**:
  - **Status**: `200 OK`
  - **Body**:
    ```json
    {
      "message": "Logout successful"
    }
    ```
- **Errors**:
  - `400 Bad Request`: Missing `X-Refresh-Token` header.
    ```json
    { "error": "refresh_token is required in X-Refresh-Token header" }
    ```
  - `401 Unauthorized`: Invalid or expired token.
  - `500 Internal Server Error`: Server-side issue.

### 4. Get Current User

Retrieves the current user’s profile information.

- **Endpoint**: `POST /getcurrentuser`
- **Headers**:
  ```http
  Content-Type: application/json
  Authorization: Bearer <access_token>
  X-Refresh-Token: <refresh_token>
  ```
- **Request Body**: Empty (`{}`)
- **Example Request**:
  ```bash
  curl -X POST https://your-backend.com/api/getcurrentuser \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <access_token>" \
  -H "X-Refresh-Token: <refresh_token>" \
  -d '{}'
  ```
- **Response**:
  - **Status**: `200 OK`
  - **Body**:
    ```json
    {
      "data": {
        "id": "<uuid>",
        "type": "currentUser",
        "attributes": {
          "email": "user@example.com",
          "emailVerified": false,
          "profile": {
            "firstName": "John",
            "lastName": "Doe",
            "displayName": "JohnDoe",
            "bio": "About me",
            "publicData": {},
            "protectedData": {
              "phoneNumber": "+91-8862898972"
            },
            "privateData": {}
          }
        },
        "relationships": {
          "profileImage": {
            "data": null
          }
        }
      },
      "new_refresh_token": "<token>",
      "expires_in": 3600
    }
    ```
- **Errors**:
  - `400 Bad Request`: Missing `X-Refresh-Token` header.
    ```json
    { "error": "refresh_token is required in X-Refresh-Token header" }
    ```
  - `401 Unauthorized`: Invalid or expired token.
  - `500 Internal Server Error`: Server-side issue.

### 5. Delete User

Deletes the current user’s account.

- **Endpoint**: `POST /deleteuser`
- **Headers**:
  ```http
  Content-Type: application/json
  Authorization: Bearer <access_token>
  X-Refresh-Token: <refresh_token>
  ```
- **Request Body**:
  ```json
  {
    "currentPassword": "password123"
  }
  ```
  - `currentPassword` (string, required): User’s current password.
- **Example Request**:
  ```bash
  curl -X POST https://your-backend.com/api/deleteuser \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <access_token>" \
  -H "X-Refresh-Token: <refresh_token>" \
  -d '{"currentPassword":"password123"}'
  ```
- **Response**:
  - **Status**: `200 OK`
  - **Body**:
    ```json
    {
      "id": "<uuid>",
      "type": "currentUser",
      "attributes": {
        "deleted": true
      }
    }
    ```
- **Errors**:
  - `400 Bad Request`: Missing password or `X-Refresh-Token` header.
    ```json
    { "error": "Current password is required" }
    ```
    or
    ```json
    { "error": "refresh_token is required in X-Refresh-Token header" }
    ```
  - `401 Unauthorized`: Invalid password or token.
  - `500 Internal Server Error`: Server-side issue.

### 6. Upload Image

Uploads an image to be used as the user’s profile picture.

- **Endpoint**: `POST /uploadimg`
- **Headers**:
  ```http
  Content-Type: multipart/form-data
  Authorization: Bearer <access_token>
  X-Refresh-Token: <refresh_token>
  ```
- **Request Body**:
  - `image` (file, required): Image file (JPEG, PNG, or GIF, max 5MB).
- **Example Request**:
  ```bash
  curl -X POST https://your-backend.com/api/uploadimg \
  -H "Authorization: Bearer <access_token>" \
  -H "X-Refresh-Token: <refresh_token>" \
  -F "image=@/path/to/image.jpg"
  ```
- **Response**:
  - **Status**: `200 OK`
  - **Body**:
    ```json
    {
      "data": {
        "imageUuid": "<uuid>",
        "imageUrl": "https://sharetribe.imgix.net/..."
      },
      "new_refresh_token": "<token>",
      "expires_in": 3600
    }
    ```
- **Errors**:
  - `400 Bad Request`: Missing or invalid image file, or missing `X-Refresh-Token` header.
    ```json
    { "error": "Image file is required" }
    ```
    or
    ```json
    { "error": "refresh_token is required in X-Refresh-Token header" }
    ```
  - `401 Unauthorized`: Invalid or expired token.
  - `500 Internal Server Error`: Server-side issue.

### 7. Update User Profile

Updates the current user’s profile information.

- **Endpoint**: `POST /update-profile`
- **Headers**:
  ```http
  Content-Type: application/json
  Authorization: Bearer <access_token>
  X-Refresh-Token: <refresh_token>
  ```
- **Query Parameters**:
  - `expand: true`
  - `include: profileImage`
  - `fields.image: variants.square-small,variants.square-small2x,variants.default`
- **Request Body**:
  ```json
  {
    "firstName": "John",
    "lastName": "Doe",
    "displayName": "JohnDoe",
    "bio": "About me",
    "profileImageId": "<uuid>",
    "publicData": {},
    "protectedData": {
      "phoneNumber": "+91-8862898972"
    },
    "privateData": {}
  }
  ```
  - All fields are optional.
  - `bio` can be a string, `null`, or omitted (empty string `""` is ignored to preserve existing bio).
  - `profileImageId` must be a valid UUID or object `{uuid: "<uuid>"}`.
  - `publicData`, `protectedData`, `privateData` must be objects, max 50KB.
- **Example Request**:
  ```bash
  curl -X POST https://your-backend.com/api/update-profile?expand=true&include=profileImage&fields.image=variants.square-small,variants.square-small2x,variants.default \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <access_token>" \
  -H "X-Refresh-Token: <refresh_token>" \
  -d '{"protectedData":{"phoneNumber":"+91-8862898972"}}'
  ```
- **Response**:
  - **Status**: `200 OK`
  - **Body**:
    ```json
    {
      "data": {
        "id": "<uuid>",
        "firstName": "John",
        "lastName": "Doe",
        "displayName": "JohnDoe",
        "bio": "About me",
        "publicData": {},
        "protectedData": {
          "phoneNumber": "+91-8862898972"
        },
        "privateData": {},
        "profileImage": null
      },
      "new_refresh_token": "<token>",
      "expires_in": 3600
    }
    ```
- **Errors**:
  - `400 Bad Request`: Validation errors or missing `X-Refresh-Token` header.
    ```json
    { "errors": [{ "msg": "profileImageId must be a valid UUID or null" }] }
    ```
    or
    ```json
    { "error": "refresh_token is required in X-Refresh-Token header" }
    ```
  - `401 Unauthorized`: Invalid or expired token.
  - `500 Internal Server Error`: Server-side issue.

### 8. Send Verification Email

Triggers a verification email for the current user.

- **Endpoint**: `POST /sendverificationemail`
- **Headers**:
  ```http
  Content-Type: application/json
  Authorization: Bearer <access_token>
  X-Refresh-Token: <refresh_token>
  ```
- **Request Body**: Empty (`{}`)
- **Example Request**:
  ```bash
  curl -X POST https://your-backend.com/api/sendverificationemail \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <access_token>" \
  -H "X-Refresh-Token: <refresh_token>" \
  -d '{}'
  ```
- **Response**:
  - **Status**: `200 OK`
  - **Body**:
    ```json
    {
      "data": {
        "id": "<uuid>",
        "type": "currentUser"
      },
      "new_refresh_token": "<token>",
      "expires_in": 3600
    }
    ```
- **Errors**:
  - `400 Bad Request`: Missing `X-Refresh-Token` header.
    ```json
    { "error": "refresh_token is required in X-Refresh-Token header" }
    ```
  - `401 Unauthorized`: Invalid or expired token.
  - `500 Internal Server Error`: Server-side issue.

## Error Handling

Errors follow a consistent format:

```json
{
  "error": "<message>"
}
```

or

```json
{
  "errors": [
    {
      "msg": "<message>"
    }
  ]
}
```

**Common Errors**:
- `400`: Validation errors, malformed input, or missing `X-Refresh-Token`.
- `401`: Authentication failure.
- `500`: Server error.

## Notes

- **Token Management**:
  - Update the client’s `access_token` with `new_refresh_token` when provided.
  - Store `expires_in` to manage token expiration.
  - Always include `X-Refresh-Token` for endpoints using `tokenRefreshMiddleware`.

- **FlutterFlow Integration**:
  - Import endpoints via Postman collection.
  - Map `Authorization` and `X-Refresh-Token` headers to `userToken` and `refreshToken` app state variables.
  - Handle `new_refresh_token` in responses to update `userToken`.
  - Use `/sendverificationemail` in the email verification modal.

- **Testing**:
  - Use Postman to test endpoints before integrating.
  - Ensure valid `access_token` and `refresh_token` are used for authenticated requests.

- **Image Upload**:
  - Use `multipart/form-data` for `/uploadimg`.
  - Validate image types (JPEG, PNG, GIF) and size (max 5MB).

## Contact

For issues or questions, contact the backend team at [nidhish.cu@gmail.com](mailto:nidhish.cu@gmail.com).
