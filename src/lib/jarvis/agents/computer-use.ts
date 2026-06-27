import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export interface ComputerAction {
  type: 'screenshot' | 'click' | 'type' | 'scroll' | 'key' | 'move'
  coordinate?: [number, number]
  text?: string
  direction?: 'up' | 'down' | 'left' | 'right'
  amount?: number
}

export interface ComputerUseResult {
  success: boolean
  actions: ComputerAction[]
  response: string
  screenshots: string[]
}

export async function executeComputerTask(
  task: string,
  tenantId: string,
  screenshotBase64?: string
): Promise<ComputerUseResult> {
  const tools: Anthropic.Tool[] = [
    {
      name: 'computer',
      description: 'Control the computer: take screenshots, click, type, scroll, press keys',
      input_schema: {
        type: 'object' as const,
        properties: {
          action: {
            type: 'string',
            enum: ['screenshot', 'left_click', 'right_click', 'double_click', 'type', 'key', 'scroll', 'mouse_move'],
            description: 'Action to perform'
          },
          coordinate: {
            type: 'array',
            items: { type: 'number' },
            description: '[x, y] coordinates for click/move actions'
          },
          text: {
            type: 'string',
            description: 'Text to type or key combination to press'
          },
          direction: {
            type: 'string',
            enum: ['up', 'down', 'left', 'right'],
            description: 'Scroll direction'
          },
          amount: {
            type: 'number',
            description: 'Scroll amount in pixels'
          }
        },
        required: ['action']
      }
    },
    {
      name: 'bash',
      description: 'Execute shell commands on the computer',
      input_schema: {
        type: 'object' as const,
        properties: {
          command: {
            type: 'string',
            description: 'Shell command to execute'
          }
        },
        required: ['command']
      }
    }
  ]

  const messages: Anthropic.MessageParam[] = [
    {
      role: 'user',
      content: screenshotBase64
        ? [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: 'image/png',
                data: screenshotBase64
              }
            },
            {
              type: 'text',
              text: task
            }
          ]
        : task
    }
  ]

  const actions: ComputerAction[] = []
  const screenshots: string[] = []
  let finalResponse = ''

  // Agentic loop — JARVIS sigue hasta completar la tarea
  while (true) {
    const response = await anthropic.messages.create({
      model: 'claude-opus-4-8',
      max_tokens: 4096,
      tools,
      messages,
      system: `Eres JARVIS, un agente de IA con control total de la computadora del cliente.
Tu objetivo es completar la tarea pedida de forma autónoma.
Usa las herramientas disponibles para ver la pantalla, hacer clic, escribir y ejecutar comandos.
Siempre toma un screenshot primero para ver el estado actual de la pantalla.
Trabaja paso a paso hasta completar la tarea.
Responde siempre en español.`
    })

    // Agregar respuesta al historial
    messages.push({ role: 'assistant', content: response.content })

    // Procesar bloques de texto
    for (const block of response.content) {
      if (block.type === 'text') {
        finalResponse = block.text
      }
    }

    // Si terminó, salir del loop
    if (response.stop_reason === 'end_turn') break

    // Procesar tool calls
    if (response.stop_reason === 'tool_use') {
      const toolResults: Anthropic.MessageParam = {
        role: 'user',
        content: []
      }

      for (const block of response.content) {
        if (block.type === 'tool_use') {
          const input = block.input as Record<string, unknown>

          if (block.name === 'computer') {
            const action = input.action as string
            const coordinate = input.coordinate as [number, number] | undefined
            const text = input.text as string | undefined

            actions.push({
              type: action as ComputerAction['type'],
              coordinate,
              text
            })

            // En producción aquí se ejecutaría la acción real en la PC del cliente
            // Por ahora retornamos confirmación simulada
            ;(toolResults.content as Anthropic.ToolResultBlockParam[]).push({
              type: 'tool_result',
              tool_use_id: block.id,
              content: action === 'screenshot'
                ? 'Screenshot captured successfully'
                : `Action "${action}" executed successfully`
            })
          }

          if (block.name === 'bash') {
            const command = input.command as string
            ;(toolResults.content as Anthropic.ToolResultBlockParam[]).push({
              type: 'tool_result',
              tool_use_id: block.id,
              content: `Command executed: ${command}`
            })
          }
        }
      }

      messages.push(toolResults)
    }
  }

  return {
    success: true,
    actions,
    response: finalResponse,
    screenshots
  }
}

// Tareas predefinidas que JARVIS puede hacer con Computer Use
export const COMPUTER_USE_TASKS = {
  openExcel: (filename: string) =>
    `Abre el archivo de Excel "${filename}" en la computadora`,

  updateSales: (data: Record<string, number>) =>
    `Abre Excel, encuentra la hoja de ventas y actualiza los datos: ${JSON.stringify(data)}`,

  sendEmail: (to: string, subject: string, body: string) =>
    `Abre el cliente de email, redacta un correo para ${to} con asunto "${subject}" y el siguiente contenido: ${body}`,

  installSoftware: (softwareName: string) =>
    `Descarga e instala ${softwareName} en la computadora`,

  takeScreenshot: () =>
    'Toma un screenshot de la pantalla actual y descríbeme qué ves',

  openBrowser: (url: string) =>
    `Abre el navegador y ve a ${url}`,

  fillForm: (url: string, data: Record<string, string>) =>
    `Ve a ${url} y llena el formulario con estos datos: ${JSON.stringify(data)}`,

  organizeFiles: (folder: string) =>
    `Organiza los archivos en la carpeta "${folder}" por tipo y fecha`
}
