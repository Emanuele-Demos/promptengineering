const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173'

export async function sendPasswordResetEmail(email: string, rawToken: string): Promise<void> {
  const resetUrl = `${FRONTEND_URL}/reimposta-password?token=${encodeURIComponent(rawToken)}`

  if (!process.env.SMTP_HOST) {
    console.log('\n--- Recupero password (modalità demo) ---')
    console.log(`Email: ${email}`)
    console.log(`Link di reimpostazione: ${resetUrl}`)
    console.log('Il link è valido per 1 ora.\n')
    return
  }

  console.warn(
    `[password-reset] SMTP_HOST configurato ma l'invio email non è attivo. Link: ${resetUrl}`
  )
}
