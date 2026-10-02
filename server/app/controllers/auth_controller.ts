import type { HttpContext } from '@adonisjs/core/http'
import { errors as authErrors } from '@adonisjs/auth'
import User from '#models/user'
import { loginValidator, registerValidator } from '#validators/auth'

const TOKEN_TTL = '30 days'

export default class AuthController {
  async register({ request, response }: HttpContext) {
    const payload = await request.validateUsing(registerValidator)
    const user = await User.create(payload)
    const token = await User.accessTokens.create(user, ['*'], { expiresIn: TOKEN_TTL })

    return response.created({ user, token: token.value!.release() })
  }

  async login({ request, response }: HttpContext) {
    const { email, password } = await request.validateUsing(loginValidator)

    try {
      const user = await User.verifyCredentials(email, password)
      const token = await User.accessTokens.create(user, ['*'], { expiresIn: TOKEN_TTL })
      return { user, token: token.value!.release() }
    } catch (error) {
      if (error instanceof authErrors.E_INVALID_CREDENTIALS) {
        return response.badRequest({ errors: [{ message: 'E-mail ou mot de passe incorrect.' }] })
      }
      throw error
    }
  }

  /** Révoque uniquement le token utilisé pour la requête. */
  async logout({ auth, response }: HttpContext) {
    const user = auth.getUserOrFail()
    await User.accessTokens.delete(user, user.currentAccessToken.identifier)

    return response.noContent()
  }
}
