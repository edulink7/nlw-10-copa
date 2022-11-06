import { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { authenticate } from "../plugins/authenticate";

export async function matchRoutes(fastify: FastifyInstance) {
  fastify.get('/pools/:id/matches', {
    onRequest: [authenticate],
  }, async (request) => {
    const getPoolParams = z.object({
      id: z.string(),
    })

    const { id } = getPoolParams.parse(request.params)

    const matches = await prisma.match.findMany({
      orderBy: {
        date: 'desc'
      },
      include: {
        guesses: {
          where: {
            participant: {
              userId: request.user.sub,
              poolId: id,
            }
          }
        }
      }
    })

    return { 
      matches: matches.map(match => {
        return {
          ...match,
          guess: match.guesses.length > 0 ? match.guesses[0] : null,
          guesses: undefined,
        }
      })
    }
  })
}