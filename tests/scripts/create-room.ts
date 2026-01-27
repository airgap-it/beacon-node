// INFO: configure homeserver.yaml properly before running this script
// e.g., setting rc_message and similar parameters to high values

import {
    getCreateRoomResponse,
    getLoginResponse
} from './../helper/helper';

const TARGET = 'localhost:8008'
const ITERATIONS = 1000
const SEED = 'testabcd'

function getRoomName(i: number) {
  return `bench_room_${Date.now()}_${i}`
}

async function runCreateRoomTest() {
  console.log('=== CREATE ROOM BENCHMARK ===')
  console.log('Target:', TARGET)
  console.log('Iterations:', ITERATIONS)
  console.log('-----------------------------')

  const times: number[] = []
  let success = 0
  let failed = 0

  const login = await getLoginResponse(SEED, TARGET)
  const userToken = login.data.access_token

  for (let i = 0; i < ITERATIONS; i++) {
    const roomName = getRoomName(i)

    try {
      const start = Date.now()

      await getCreateRoomResponse(
        SEED,
        userToken,
        TARGET,
        roomName
      )

      const elapsed = Date.now() - start

      times.push(elapsed)
      success++
      console.log(`Room ${i + 1}: ${elapsed} ms`)
    } catch (err: any) {
      failed++
      console.log(`Room ${i + 1} failed:`)

      if (err?.data) {
        console.log(err.data)
      } else {
        console.log(err)
      }
    }
  }

  if (times.length === 0) {
    console.log('\nNo successful room creations.')
    return
  }

  const sum = times.reduce((a, b) => a + b, 0)
  const avg = sum / times.length
  const min = Math.min(...times)
  const max = Math.max(...times)

  console.log('\n=== RESULT ===')
  console.log('Success:', success)
  console.log('Failed:', failed)
  console.log('Avg ms:', avg.toFixed(2))
  console.log('Min ms:', min)
  console.log('Max ms:', max)
}

runCreateRoomTest().catch(console.error)
