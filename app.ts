import express from 'express'
import jwt from 'jsonwebtoken'

const app = express()
app.use(express.json())

const SERVER_REGISTER_SECRET = 'your-server-register-secret'
const SERVER_RESET_PASSWORD_SECRET = 'your-server-reset-password-secret'

// Step 1: Request OTP
app.post('/register/request-otp', (req, res) => {
  const { email, password } = req.body as RegisterTokenRequestBody

  // Check if user already exists
  if (users.find((user) => user.email === email)) {
    res.status(400).json({ error: 'User already exists' })
    return
  }

  // Generate OTP and sign the token
  const otp = generateOTP()
  const secretKey = `${SERVER_REGISTER_SECRET}-${otp}`
  const token = jwt.sign({ email, password }, secretKey, { expiresIn: '5m' })

  console.log(`OTP for ${email}:`, otp) // Simulate sending OTP
  res.json({ token })
})

// Step 2: Verify OTP & Register
app.post('/register/verify', (req, res) => {
  const { token, otp } = req.body as RegisterVerifyRequestBody
  const secretKey = `${SERVER_REGISTER_SECRET}-${otp}`

  try {
    // Verify the token
    const decoded = jwt.verify(token, secretKey) as RegisterJwtPayload

    // Check if user already exists
    if (users.find((user) => user.email === decoded.email)) {
      res.status(400).json({ error: 'User already exists' })
      return
    }

    // Insert user into the database
    users.push({
      email: decoded.email,
      password: decoded.password,
      passwordChangedAt: new Date(),
    })

    res.json({ message: 'User registered successfully' })
  } catch (err) {
    res.status(400).json({ error: 'Invalid OTP or token' })
  }
})

// Step 1: Request Password Reset Token
app.post('/password-reset/request', (req, res) => {
  const { email } = req.body as ResetPasswordTokenRequestBody

  // Check if user exists
  if (!users.find((user) => user.email === email)) {
    res.status(400).json({ error: 'User not found' })
    return
  }

  // Generate OTP and sign the token
  const otp = generateOTP()
  const secretKey = `${SERVER_RESET_PASSWORD_SECRET}-${otp}`
  const token = jwt.sign({ email }, secretKey, { expiresIn: '5m' })

  console.log(`OTP for password reset ${email}:`, otp) // Simulate sending OTP
  res.json({ token })
})

// Step 2: Verify OTP & Reset Password
app.post('/password-reset/verify', (req, res) => {
  const { token, otp, newPassword } = req.body as ResetPasswordVerifyRequestBody
  const secretKey = `${SERVER_RESET_PASSWORD_SECRET}-${otp}`

  try {
    // Verify the token
    const decoded = jwt.verify(token, secretKey) as ResetPasswordJwtPayload

    // Check if user exists
    const user = users.find((user) => user.email === decoded.email)

    if (!user) {
      res.status(400).json({ error: 'User not found' })
      return
    }

    if (!decoded.iat) {
      throw new Error('Token issued date not found')
    }

    if (
      user.passwordChangedAt &&
      decoded.iat < user.passwordChangedAt.getTime()
    ) {
      res
        .status(400)
        .json({ error: 'Token issued before last password change' })

      return
    }

    // Update password on the database
    user.password = newPassword
    user.passwordChangedAt = new Date()

    res.json({ message: 'Password reset successful' })
  } catch (err) {
    res.status(400).json({ error: 'Invalid OTP or token' })
  }
})

app.listen(3000, () => console.log('Server running on port 3000'))

// ---------- Utilities and Databases --- Can be a separate file

// User model
type User = {
  email: string
  password: string
  passwordChangedAt: Date
}

// Simulate database
const users: User[] = []

function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

// ---------- Necessary Types --- Can be a separate file

type RegisterJwtPayload = jwt.JwtPayload & {
  email: string
  password: string
}

type ResetPasswordJwtPayload = jwt.JwtPayload & {
  email: string
}

type RegisterTokenRequestBody = {
  email: string
  password: string
}

type RegisterVerifyRequestBody = {
  token: string
  otp: string
}

type ResetPasswordTokenRequestBody = {
  email: string
}

type ResetPasswordVerifyRequestBody = {
  token: string
  otp: string
  newPassword: string
}
