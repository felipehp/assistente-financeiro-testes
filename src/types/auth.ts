export type Role = 'estudante' | 'professor' | 'admin'

export interface AuthUser {
  username: string
  role: Role
}

export interface LoginResponse {
  access_token: string
  token_type: string
  role: Role
}
