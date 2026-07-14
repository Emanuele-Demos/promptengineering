import rateLimit from 'express-rate-limit'

export const loginRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Troppi tentativi di login. Riprova tra qualche minuto.' },
})
