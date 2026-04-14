/**
 * Gera chaves seguras para JWT_SECRET e JWT_REFRESH_SECRET
 * Execute: node gerar-segredos.js
 */
const crypto = require('crypto')

const jwt = crypto.randomBytes(64).toString('hex')
const refresh = crypto.randomBytes(64).toString('hex')

console.log('\n=== COPIE ESTAS CHAVES PARA O RAILWAY ===\n')
console.log(`JWT_SECRET=${jwt}`)
console.log(`JWT_REFRESH_SECRET=${refresh}`)
console.log('\n==========================================\n')
console.log('IMPORTANTE: Guarde estas chaves em local seguro.')
console.log('Se perder as chaves, todos os usuários serão deslogados.\n')
