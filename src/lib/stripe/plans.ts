export const PLANS = {
  agency: {
    id: 'agency',
    name: 'Agencia',
    price: 297,
    currency: 'usd',
    interval: 'month',
    maxClients: 10,
    maxAgents: 5,
    features: ['Hasta 10 clientes', '5 agentes activos', 'WhatsApp + llamadas', 'Marketing 6 redes', 'Soporte prioritario'],
    stripePriceId: process.env.STRIPE_PRICE_AGENCY || 'price_agency',
  },
  elite: {
    id: 'elite',
    name: 'Agencia Elite',
    price: 597,
    currency: 'usd',
    interval: 'month',
    maxClients: 50,
    maxAgents: 9,
    features: ['Hasta 50 clientes', '9 agentes activos', 'Todo lo de Agencia', 'Videos IA con HeyGen', 'Control de PC', 'API personalizada'],
    stripePriceId: process.env.STRIPE_PRICE_ELITE || 'price_elite',
  },
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise',
    price: 1497,
    currency: 'usd',
    interval: 'month',
    maxClients: 999,
    maxAgents: 9,
    features: ['Clientes ilimitados', 'Todos los agentes', 'White-label completo', 'Integración custom', 'Account manager dedicado', 'SLA 99.9%'],
    stripePriceId: process.env.STRIPE_PRICE_ENTERPRISE || 'price_enterprise',
  }
} as const

export type PlanId = keyof typeof PLANS
