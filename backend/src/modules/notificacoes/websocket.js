import { prisma } from '../../database/prisma.js'

const clients = new Map()

export function wsHandler(connection, request) {
  const token = request.query.token
  
  if (!token) {
    connection.socket.close(1008, 'Token obrigatório')
    return
  }
  
  let userId
  try {
    const decoded = request.server.jwt.verify(token)
    userId = decoded.userId
  } catch {
    connection.socket.close(1008, 'Token inválido')
    return
  }
  
  clients.set(userId, connection.socket)
  
  connection.socket.on('message', (msg) => {
    try {
      const data = JSON.parse(msg)
      if (data.type === 'ping') {
        connection.socket.send(JSON.stringify({ type: 'pong' }))
      }
    } catch {}
  })
  
  connection.socket.on('close', () => {
    clients.delete(userId)
  })
}

export function notificarUsuario(userId, payload) {
  const socket = clients.get(userId)
  if (socket && socket.readyState === 1) {
    socket.send(JSON.stringify(payload))
  }
}
