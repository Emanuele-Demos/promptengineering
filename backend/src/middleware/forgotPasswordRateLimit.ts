import rateLimit from 'express-rate-limit'

export const forgotPasswordRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: 'Troppi tentativi di recupero password. Riprova tra qualche minuto.',
  },
})
