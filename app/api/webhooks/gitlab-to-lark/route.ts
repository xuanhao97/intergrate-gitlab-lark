import { NextRequest, NextResponse } from 'next/server'
import { generateLarkMessage } from '@/lib/template-generator'
import { sendToLark } from '@/lib/lark-sender'

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()

    const gitlabEvent = JSON.parse(body)
    const eventType = request.headers.get('X-Gitlab-Event')
    
    console.log(`Received GitLab webhook: ${eventType}`)
    
    // Generate Lark message template
    const larkMessage = generateLarkMessage(gitlabEvent, eventType)

    console.log("Lark Messages: ", larkMessage)
    
    if (!larkMessage) {
      return NextResponse.json({ error: 'Unsupported event type' }, { status: 400 })
    }
    
    // Send to Lark webhook
    const larkResponse = await sendToLark(request, larkMessage)
    
    if (!larkResponse.success) {
      console.log('Failed to send to Lark:', larkResponse.error)
      return NextResponse.json({ error: 'Failed to send to Lark' }, { status: 500 })
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Webhook processed successfully',
      eventType,
      larkMessageId: larkResponse.messageId
    })
    
  } catch (error) {
    console.log('Error processing GitLab webhook:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
