import { FastifyInstance } from 'fastify';

// Define las rutas de la partida
export default async function rutasPartida(fastify: FastifyInstance): Promise<void> {

  // Consultar estado actual de la partida
  fastify.get('/api/v1/partida/estado', async (request, reply) => {
    return { estado: 'esperando' };
  });

  // Solicitar nueva partida
  fastify.post('/api/v1/partida/nueva', async (request, reply) => {
    return { ok: true, partidaId: 'abc-123' };
  });
}