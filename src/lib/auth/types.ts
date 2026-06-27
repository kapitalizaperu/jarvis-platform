export type UserRole = 'owner' | 'agency' | 'client'

export interface JarvisUser {
  id: string
  email: string
  name: string
  role: UserRole
  tenantId: string
  agencyId?: string  // for Level 2 clients, which agency owns them
  avatarUrl?: string
  createdAt: string
}

export interface Tenant {
  id: string
  name: string
  ownerId: string
  plan: 'starter' | 'agency' | 'elite' | 'enterprise'
  maxClients: number
  activeAgents: string[]
  createdAt: string
}

export interface AuthSession {
  user: JarvisUser
  token: string
  expiresAt: string
}
