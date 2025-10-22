const { generateOTP, verifyOTP } = require('../data/inMemoryStore');

async function requestOTP(req, res) {
  const { phone } = req.body;
  if (!phone) return res.status(400).json({ error: 'Phone is required' });

  const otp = generateOTP(phone); // Mock OTP
  res.json({ message: 'OTP generated successfully', phone, otp });
}

async function verifyUserOTP(req, res) {
  const { phone, otp } = req.body;
  if (!phone || !otp) return res.status(400).json({ error: 'Phone and OTP are required' });

  const result = verifyOTP(phone, otp);
  if (!result.success) return res.status(400).json(result);

  // Mock token (you can replace with JWT later)
  const token = Buffer.from(`${phone}-${Date.now()}`).toString('base64');
  res.json({ message: 'Login successful', token, user: result.user });
}

module.exports = { requestOTP, verifyUserOTP };
