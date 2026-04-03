export function errorHandler(error, request, reply) {
  const statusCode = error.statusCode || 500
  
  if (process.env.NODE_ENV !== 'production') {
    console.error(error)
  }
  
  // Prisma errors
  if (error.code === 'P2002') {
    return reply.status(409).send({
      error: 'Registro duplicado',
      message: 'Já existe um registro com esses dados',
    })
  }
  
  if (error.code === 'P2025') {
    return reply.status(404).send({
      error: 'Não encontrado',
      message: 'Registro não encontrado',
    })
  }
  
  reply.status(statusCode).send({
    error: error.name || 'Erro interno',
    message: error.message || 'Erro interno do servidor',
  })
}
