export interface AuthUser {
  id: string
  name: string
  email: string
  role: string
  color: string
}

export interface LoginResponse {
  user: AuthUser
  token: string
  expiresIn: string
}

export interface MeResponse {
  user: AuthUser
}

export declare function login(params: {
  email: string
  password: string
  rememberMe?: boolean
}): Promise<LoginResponse>

export declare function fetchCurrentUser(token: string): Promise<MeResponse>
