import Log from '../models/Log.js'

const initializeLogWebSocket = (wss) => {
  wss.on('connection', (ws, req) => {
    console.log('New WebSocket connection for real-time logs')
    
    // Send recent logs when client connects
    const sendRecentLogs = async () => {
      try {
        const recentLogs = await Log.find()
          .sort({ timestamp: -1 })
          .limit(50)
        
        ws.send(JSON.stringify({
          type: 'initial',
          logs: recentLogs.reverse() // Send in chronological order
        }))
      } catch (error) {
        console.error('Error sending recent logs:', error)
      }
    }
    
    sendRecentLogs()
    
    // Handle client messages
    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data)
        
        switch (message.type) {
          case 'ping':
            ws.send(JSON.stringify({ type: 'pong' }))
            break
          case 'subscribe':
            // Handle subscription to specific services/levels
            console.log('Client subscribed to:', message.filters)
            break
        }
      } catch (error) {
        console.error('Error processing WebSocket message:', error)
      }
    })
    
    // Handle connection close
    ws.on('close', () => {
      console.log('WebSocket connection closed for logs')
    })
    
    // Handle errors
    ws.on('error', (error) => {
      console.error('WebSocket error:', error)
    })
  })
}

export default initializeLogWebSocket