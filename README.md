# JWT-Based OTP Authentication Theory

## Overview

This document outlines a JWT-based OTP authentication mechanism for user registration and password reset. The approach ensures security without storing OTPs in a database by dynamically generating secrets for JWT signing.

---

## Registration Process

### Step 1: Request OTP

1. The client submits user details (e.g., email, username, password) to the server.
2. The server generates a random OTP.
3. The server signs a JWT token with a secret key:
   - **Secret Key Format:** `server-secret + OTP`
   - The token contains the user details.
4. The server sends the OTP to the user via email/SMS and returns the JWT token to the client.
5. The client stores the token temporarily.

### Step 2: Verify OTP and Complete Registration

1. The client submits the JWT token and OTP to the server.
2. The server verifies the JWT token using the secret key (`server-secret + OTP`).
3. If verification succeeds:
   - The server checks if the email/username already exists in the database.
   - [If] the email/username does not exist, the user is created based on the user details from the token.
   - [Else], an error message is returned.
4. If verification fails, an error message is returned.

### Security Enhancements

- To prevent duplicate account creation with the same token and OTP:
  1. On the first step of registration, the server checks if the email/username already exists.
  2. On the second step, the server can also check if the email/username already exists. This can be optimized by using a unique email/username constraint in the database.

---

## Password Reset Process

### Step 1: Request Password Reset Token

1. The client submits user identification (email/username/ID) to the server.
2. The server generates a random OTP.
3. The server signs a JWT token with a secret key:
   - **Secret Key Format:** `server-secret + OTP`
   - The token contains the user identifier.
4. The server sends the OTP to the user and returns the JWT token to the client.
5. The client stores the token temporarily.

### Step 2: Verify OTP and Reset Password

1. The client submits the JWT token and OTP to the server along with the new password.
2. The server verifies the JWT token using `server-secret + OTP`.
3. If verification succeeds:
   - The server checks if the password has already been reset using `passwordChangedAt`.
   - [If] `passwordChangedAt` is after the token creation date, the request is rejected.
   - [Else], the password is updated, and `passwordChangedAt` is set to the current timestamp.
4. If verification fails, an error message is returned.

### Security Enhancements

- Prevent repeated password resets with the same token and OTP:
  - Save `passwordChangedAt` in the user record.
  - [If] a reset attempt is made with an old token, the server checks if `passwordChangedAt` is after the token creation date. Then the request needs to be rejected.

---

## Best Practices

- Use a dynamic secret key for JWT signing:
  - Registration: `${server-secret}-REGISTER-${OTP}`
  - Password Reset: `${server-register-secret}-${OTP}`
- Ensure unique tracking of user actions (e.g., email uniqueness, `passwordChangedAt` timestamps).
- Use small OTP expiry times to reduce security risks. eg. 5 minutes.
- Implement rate limiting to prevent brute-force attacks.

This approach secures registration and password reset flows while avoiding persistent OTP storage.
