import rateLimit from 'express-rate-limit'

export const registerRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Troppi tentativi di registrazione. Riprova tra qualche minuto.' },
})
