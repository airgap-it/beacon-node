// INFO: configure homeserver.yaml properly before running this script
// e.g., setting rc_message and similar parameters to high values

import { getLoginResponse } from './../helper/helper';

const TARGET = 'localhost:8008'
const ITERATIONS = 1000
const SEED = 'testabcd' 

async function runLoginTest() {
  console.log('=== LOGIN BENCHMARK ===')
  console.log('Target:', TARGET)
  console.log('Iterations:', ITERATIONS)
  console.log('-----------------------')

  const times: number[] = []
  let success = 0
  let failed = 0

  for (let i = 0; i < ITERATIONS; i++) {
    try {
      const start = Date.now()

      await getLoginResponse(SEED, TARGET)

      const elapsed = Date.now() - start

      times.push(elapsed)
      success++

      console.log(`Login ${i + 1}: ${elapsed} ms`)
    } catch (err: any) {
      failed++
      console.log(`Login ${i + 1} failed:`)

      if (err?.data) {
        console.log(err.data)
      } else {
        console.log(err)
      }
    }
  }

  if (times.length === 0) {
    console.log('\nNo successful logins.')
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

runLoginTest().catch(console.error)

