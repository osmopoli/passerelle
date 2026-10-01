import vine from '@vinejs/vine'
import { LIMITS } from '#constants/domain'

export const createExchangeRequestValidator = vine.compile(
  vine.object({
    message: vine.string().trim().maxLength(LIMITS.message).optional(),
  })
)
