// INFO: configure homeserver.yaml properly before running this script
// e.g., setting rc_message and similar parameters to high values
 
import {
  getLoginResponse,
  getCreateRoomResponse,
  getSendMsgResponse
} from './../helper/helper'

const TARGET = 'localhost:8008'
const SEED = 'test-seed-123'
const MESSAGE_COUNT = 1000

async function testSendMessages() {
  console.log('Starting send message test')
  console.log('Target:', TARGET)
  console.log('Messages:', MESSAGE_COUNT)

  const login = await getLoginResponse(SEED, TARGET)
  const token = login.data.access_token

  const roomResp = await getCreateRoomResponse(
    SEED,
    token,
    TARGET,
    'send_test_' + Date.now()
  )

  const roomId = roomResp.data.room_id

  console.log('Room created:', roomId)

  const times: number[] = []
  let success = 0

  for (let i = 1; i <= MESSAGE_COUNT; i++) {
    const start = Date.now()

    try {
      await getSendMsgResponse(token, TARGET, roomId)

      const elapsed = Date.now() - start
      times.push(elapsed)

      console.log(`Message ${i}: ${elapsed} ms`)
      success++
    } catch (err) {
      console.log(`Message ${i} failed`, err)
    }
  }

  if (times.length > 0) {
    const avg = times.reduce((a, b) => a + b, 0) / times.length
    const min = Math.min(...times)
    const max = Math.max(...times)

    console.log('\n=== RESULT ===')
    console.log('Success:', success)
    console.log('Avg ms:', avg.toFixed(2))
    console.log('Min ms:', min)
    console.log('Max ms:', max)
  } else {
    console.log('No successful messages')
  }
}

testSendMessages().catch(console.error)
