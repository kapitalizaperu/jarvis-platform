// ── Agente Financiero ─────────────────────────────────────────────────────────

import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export interface FinancialReport {
  period: string
  revenue: number
  expenses: number
  profit: number
  margin: number
  topExpenses: { category: string; amount: number }[]
  recommendations: string[]
  alerts: string[]
}

// Analizar datos financieros y generar reporte
export async function analyzeFinancials(params: {
  data: {
    revenue: number
    expenses: Record<string, number>
    period: string
    previousRevenue?: number
  }
  businessContext?: string
}): Promise<FinancialReport> {

  const totalExpenses = Object.values(params.data.expenses).reduce((a, b) => a + b, 0)
  const profit = params.data.revenue - totalExpenses
  const margin = params.data.revenue > 0 ? (profit / params.data.revenue) * 100 : 0
  const growth = params.data.previousRevenue
    ? ((params.data.revenue - params.data.previousRevenue) / params.data.previousRevenue) * 100
    : null

  const expensesText = Object.entries(params.data.expenses)
    .map(([k, v]) => `${k}: $${v.toLocaleString()}`)
    .join('\n')

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    messages: [{
      role: 'user',
      content: `Analiza estos datos financieros y da recomendaciones específicas.

PERÍODO: ${params.data.period}
INGRESOS: $${params.data.revenue.toLocaleString()}
GASTOS TOTALES: $${totalExpenses.toLocaleString()}
UTILIDAD: $${profit.toLocaleString()}
MARGEN: ${margin.toFixed(1)}%
${growth !== null ? `CRECIMIENTO vs período anterior: ${growth.toFixed(1)}%` : ''}

DESGLOSE DE GASTOS:
${expensesText}

${params.businessContext ? `CONTEXTO: ${params.businessContext}` : ''}

Dame:
1. Las 3 recomendaciones más importantes para mejorar la rentabilidad
2. Las alertas o riesgos que ves en estos números

Formato JSON: { "recommendations": ["rec1","rec2","rec3"], "alerts": ["alerta1"] }`,
    }],
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : '{}'
  let aiInsights = { recommendations: [], alerts: [] }
  try {
    aiInsights = JSON.parse(text.match(/\{[\s\S]*\}/)?.[0] ?? '{}')
  } catch { /* usa defaults */ }

  const topExpenses = Object.entries(params.data.expenses)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([category, amount]) => ({ category, amount }))

  return {
    period: params.data.period,
    revenue: params.data.revenue,
    expenses: totalExpenses,
    profit,
    margin: parseFloat(margin.toFixed(1)),
    topExpenses,
    recommendations: aiInsights.recommendations ?? [],
    alerts: aiInsights.alerts ?? [],
  }
}

// Generar factura automática
export async function generateInvoice(params: {
  clientName: string
  clientEmail: string
  items: { description: string; quantity: number; unitPrice: number }[]
  currency?: string
  notes?: string
  businessInfo: { name: string; address?: string; taxId?: string }
}): Promise<{ invoiceNumber: string; total: number; html: string }> {

  const currency = params.currency ?? 'USD'
  const subtotal = params.items.reduce((s, i) => s + i.quantity * i.unitPrice, 0)
  const tax = subtotal * 0.18 // IGV Perú / IVA México
  const total = subtotal + tax
  const invoiceNumber = `INV-${Date.now().toString().slice(-6)}`

  const itemsRows = params.items.map(item => `
    <tr>
      <td style="padding:8px;border-bottom:1px solid #eee">${item.description}</td>
      <td style="padding:8px;border-bottom:1px solid #eee;text-align:center">${item.quantity}</td>
      <td style="padding:8px;border-bottom:1px solid #eee;text-align:right">${currency} ${item.unitPrice.toFixed(2)}</td>
      <td style="padding:8px;border-bottom:1px solid #eee;text-align:right">${currency} ${(item.quantity * item.unitPrice).toFixed(2)}</td>
    </tr>`).join('')

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><style>
  body { font-family: Arial, sans-serif; color: #333; max-width: 800px; margin: 0 auto; padding: 40px; }
  .header { display: flex; justify-content: space-between; margin-bottom: 40px; }
  .logo { font-size: 28px; font-weight: bold; color: #0A0A0A; }
  .invoice-info { text-align: right; color: #666; }
  table { width: 100%; border-collapse: collapse; }
  th { background: #0A0A0A; color: white; padding: 12px 8px; text-align: left; }
  .totals { margin-top: 20px; text-align: right; }
  .total-line { display: flex; justify-content: flex-end; gap: 40px; margin: 4px 0; }
  .grand-total { font-size: 20px; font-weight: bold; color: #0A0A0A; border-top: 2px solid #0A0A0A; padding-top: 8px; }
</style></head>
<body>
  <div class="header">
    <div>
      <div class="logo">${params.businessInfo.name}</div>
      ${params.businessInfo.address ? `<div style="color:#666;font-size:13px;margin-top:4px">${params.businessInfo.address}</div>` : ''}
      ${params.businessInfo.taxId ? `<div style="color:#666;font-size:13px">RUC/RFC: ${params.businessInfo.taxId}</div>` : ''}
    </div>
    <div class="invoice-info">
      <div style="font-size:24px;font-weight:bold">FACTURA</div>
      <div>#${invoiceNumber}</div>
      <div>Fecha: ${new Date().toLocaleDateString('es-PE')}</div>
    </div>
  </div>

  <div style="margin-bottom:30px">
    <div style="font-size:12px;color:#999;text-transform:uppercase;margin-bottom:4px">Facturar a</div>
    <div style="font-weight:bold;font-size:18px">${params.clientName}</div>
    <div style="color:#666">${params.clientEmail}</div>
  </div>

  <table>
    <thead><tr>
      <th>Descripción</th><th style="text-align:center">Cant.</th>
      <th style="text-align:right">Precio unit.</th><th style="text-align:right">Total</th>
    </tr></thead>
    <tbody>${itemsRows}</tbody>
  </table>

  <div class="totals">
    <div class="total-line"><span>Subtotal:</span><span>${currency} ${subtotal.toFixed(2)}</span></div>
    <div class="total-line"><span>IGV/IVA (18%):</span><span>${currency} ${tax.toFixed(2)}</span></div>
    <div class="total-line grand-total"><span>TOTAL:</span><span>${currency} ${total.toFixed(2)}</span></div>
  </div>

  ${params.notes ? `<div style="margin-top:30px;padding:16px;background:#f9f9f9;border-radius:8px;font-size:13px;color:#666">${params.notes}</div>` : ''}

  <div style="margin-top:40px;text-align:center;font-size:12px;color:#999">
    Generado automáticamente por JARVIS IA · ${params.businessInfo.name}
  </div>
</body>
</html>`

  return { invoiceNumber, total, html }
}
