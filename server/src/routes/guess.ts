import { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { authenticate } from "../plugins/authenticate";

export async function guessRoutes(fastify: FastifyInstance) {
  fastify.get('/guesses/count', async () => {
    const count = await prisma.guess.count()

    return { count }
  })

  fastify.post('/pools/:poolId/matches/:matchId/guesses', {
    onRequest: [authenticate]
  }, async (request, reply) => {
    const createGuessParams = z.object({
      poolId: z.string(),
      matchId: z.string(),
    })

    const createGuessBody = z.object({
      firstTeamPoints: z.number(),
      secondTeamPoints: z.number(),
    })

    const { poolId, matchId } = createGuessParams.parse(request.params)
    const { firstTeamPoints, secondTeamPoints } = createGuessBody.parse(request.body)

    const participant = await prisma.participant.findUnique({
      where: {
        userId_poolId: {
          poolId,
          userId: request.user.sub,
        }
      }
    })

    if (!participant) {
      return reply.status(400).send({
        message: "You're not allowed to create a guess in this pool."
      })
    }

    const guess = await prisma.guess.findUnique({
      where: {
        participantId_matchId: {
          participantId: participant.id,
          matchId
        }
      }
    })

    if (guess) {
      return reply.status(400).send({
        message: "You have already sent a guess to this match on this pool."
      })
    }

    const match = await prisma.match.findUnique({
      where: {
        id: matchId,
      }
    })

    if (!match) {
      return reply.status(400).send({
        message: "Match not found."
      })
    }

    if (match.date < new Date()) {
      return reply.status(400).send({
        message: "You cannot send guesses after the match date."
      })
    }

    await prisma.guess.create({
      data: {
        matchId,
        participantId: participant.id,
        firstTeamPoints,
        secondTeamPoints
      }
    })

    return reply.status(201).send()
  })
}