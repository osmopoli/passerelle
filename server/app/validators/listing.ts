import vine from '@vinejs/vine'
import { CATEGORY_VALUES, LIMITS, LISTING_TYPE_VALUES } from '#constants/domain'

export const createListingValidator = vine.compile(
  vine.object({
    type: vine.enum(LISTING_TYPE_VALUES),
    category: vine.enum(CATEGORY_VALUES),
    title: vine.string().trim().minLength(1).maxLength(LIMITS.title),
    description: vine.string().trim().minLength(1).maxLength(LIMITS.description),
    availability: vine.string().trim().minLength(1).maxLength(LIMITS.availability),
  })
)

export const listListingsValidator = vine.compile(
  vine.object({
    type: vine.enum(LISTING_TYPE_VALUES).optional(),
    category: vine.enum(CATEGORY_VALUES).optional(),
  })
)
