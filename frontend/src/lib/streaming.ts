/**
 * SSE streaming client for AI assist responses.
 */

const API_BASE =
  (import.meta as unknown as { env?: { VITE_API_BASE_URL?: string } }).env
    ?.VITE_API_BASE_URL || 'http://localhost:8000'

export interface StreamRequest {
  file_content?: string
  prompt?: string
  language?: string
  cursor_position?: { line: number; column: number }
}

export async function streamAssistResponse(
  request: StreamRequest,
  token: string,
  onToken: (token: string) => void,
  onDone: () => void,
  onError: (error: string) => void
): Promise<void> {
  try {
    const response = await fetch(`${API_BASE}/assist/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(request),
    })

    if (!response.ok) {
      const errorText = await response.text()
      onError(errorText || `HTTP ${response.status}`)
      return
    }

    const reader = response.body?.getReader()
    if (!reader) {
      onError('No response body')
      return
    }

    const decoder = new TextDecoder()
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.slice(6))
            if (data.done) {
              onDone()
              return
            }
            if (data.token) {
              onToken(data.token)
            }
          } catch {
            // skip unparseable lines
          }
        } else if (line.startsWith('event: error')) {
          // Next data line will contain error
          continue
        }
      }
    }

    onDone()
  } catch (error) {
    onError(error instanceof Error ? error.message : 'Stream failed')
  }
}
