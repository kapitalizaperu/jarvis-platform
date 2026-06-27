import { NextRequest, NextResponse } from 'next/server'
import { executeComputerTask } from '@/lib/jarvis/agents/computer-use'

export async function POST(req: NextRequest) {
  try {
    const { task, tenantId, screenshotBase64 } = await req.json()

    if (!task) {
      return NextResponse.json({ error: 'Task is required' }, { status: 400 })
    }

    const result = await executeComputerTask(task, tenantId || 'default', screenshotBase64)

    return NextResponse.json({
      success: true,
      data: result
    })
  } catch (error) {
    console.error('Computer Use error:', error)
    return NextResponse.json(
      { error: 'Error executing computer task' },
      { status: 500 }
    )
  }
}
