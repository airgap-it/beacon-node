import { IllegalArgumentError } from '@influxdata/influxdb-client'
import axios, { AxiosError, AxiosResponse, Method } from 'axios'
import * as _sodium from 'libsodium-wrappers'
const sodium = (_sodium as any).default

interface ResultEntry {
  login: number
  createRoom: number
  sendMsg: number
  testRooms: number
  normalRooms: number
  totalRooms: number
  userCount: number
}

export const DELAY_TIME = 100

const allNodes = new Map<string, string[]>()

export async function readAllNodeFromEnv(): Promise<Map<string, string[]>> {
  if (allNodes.size != 0) {
    return allNodes
  }

  Object.keys(process.env).forEach(function (key) {
    if (!key.startsWith('SYNAPSE')) {
      return
    }

    let vals = process.env[key]?.split(';')
    if (vals?.length == 3) {
      allNodes.set(vals[0], vals.slice(1, 3))
    }
  })

  return allNodes
}

export async function delay(ms: number = DELAY_TIME) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function getMonitoringData(nodes: string[] = []): Promise<Map<string, ResultEntry>> {
  if (nodes.length == 0) {
    nodes = [...(await readAllNodeFromEnv()).keys()] || ['beacon-node-1.sky.papers.tech']
  }

  const result = new Map<string, ResultEntry>()

  const promises = []
  for (const node of nodes) {
    const res = await getNodeData(node)
    promises.push(res)
  }

  const intermediateResult = promises // await Promise.all(promises)
  // for (const idx in intermediateResult) {
  for (const res of intermediateResult) {
    result.set(res.node, res.resultEntry)
  }

  return result
}

async function getNodeData(node: string) {
  console.log(new Date(), node, 'getNodeData')
  const seed = process.env.TEST_SEED || 'testabcd'

  const resultEntry: ResultEntry = {
    login: 0,
    createRoom: 0,
    sendMsg: 0,
    testRooms: 0,
    normalRooms: 0,
    totalRooms: 0,
    userCount: 0
  }
  try {
    let start = Date.now()
    const login = await getLoginResponse(seed, node)
    resultEntry.login = Date.now() - start

    const adminLogin = await getAdminLoginResponse(node)

    start = Date.now()
    let roomResp: any
    try {
      roomResp = await getCreateRoomResponse(seed, login.data.access_token, node, getTestRoomName())
      resultEntry.createRoom = Date.now() - start
      start = Date.now()
      await getSendMsgResponse(login.data.access_token, node, roomResp.data.room_id)
      resultEntry.sendMsg = Date.now() - start
      try {
        await removeRoom(node, roomResp.data.room_id, adminLogin.data.access_token)
      } catch (error) {
        console.log(new Date(), node, 'could not remove room')
      }
    } catch (error) {
      console.log(new Date(), node, 'could not get send msg for ')
    }

    try {
      const roomsCount = await getRoomCounts(node, adminLogin.data.access_token)

      resultEntry.testRooms = roomsCount[0]
      resultEntry.normalRooms = roomsCount[1]
      resultEntry.totalRooms = roomsCount[2]
    } catch (error) {
      console.log('could not get rooms for ', node)
    }

    try {
      resultEntry.userCount = await getUserCount(node, adminLogin.data.access_token)
    } catch (error) {
      console.log('could not get usercount for ', node)
    }
  } catch (error) {
    console.log('error recieving data from ', node)
    console.log(error)
    // Do nothing
  }
  return { node, resultEntry }
}

function getTestRoomName() {
  return 'test_room_airgap_' + new Date().getTime().toString()
}

function toHex(value: any): string {
  return Buffer.from(value).toString('hex')
}

async function getKeypairFromSeed(seed: string): Promise<_sodium.KeyPair> {
  await sodium.ready
  return sodium.crypto_sign_seed_keypair(sodium.crypto_generichash(32, sodium.from_string(seed)))
}

// see https://github.com/airgap-it/beacon-node/blob/master/docker/crypto_auth_provider.py
async function loginRequestFromKeyPair(kp: _sodium.KeyPair): Promise<any> {
  await _sodium.ready

  const enquiry = sodium.from_string(`login:${Math.floor(Date.now() / 1000 / (5 * 60))}`)
  const digest = sodium.crypto_generichash(32, enquiry)
  const sig = sodium.crypto_sign_detached(digest, kp.privateKey)
  const keyHash = sodium.crypto_generichash(32, kp.publicKey)

  return {
    type: 'm.login.password',
    identifier: {
      type: 'm.id.user',
      user: toHex(keyHash)
    },
    password: `ed:${toHex(sig)}:${toHex(kp.publicKey)}`,
    device_id: toHex(kp.publicKey)
  }
}

async function getLoginPasswordDataFromSeed(seed: string) {
  await sodium.ready
  const keyPair = await getKeypairFromSeed(seed)
  return loginRequestFromKeyPair(keyPair)
}

export async function getLoginResponse(
  seed: string,
  host: string = 'beacon-node-1.sky.papers.tech'
): Promise<any> {
  const loginData = await getLoginPasswordDataFromSeed(seed)
  let response: AxiosResponse<any>
  try {
    const cancelTokenSource = axios.CancelToken.source()
    response = await axios.request({
      method: 'POST',
      url: '/login',
      baseURL: 'http://' + host + '/_matrix/client/r0',
      headers: undefined,
      data: loginData,
      cancelToken: cancelTokenSource.token
    })
  } catch (axiosError) {
    throw (axiosError as AxiosError).response
  }

  return response
}

async function getAdminCredentialsFromEnv(node: string) {
  let supportedNodes = await readAllNodeFromEnv()
  if (!supportedNodes.has(node)) {
    throw new IllegalArgumentError('unsupported node')
  }
  return supportedNodes.get(node) || []
}

export async function getAdminLoginResponse(
  host: string = 'beacon-node-1.sky.papers.tech'
): Promise<any> {
  const MAX_RETRIES = 5
  let gotResponse = false
  let retryCount = 0

  let username = ''
  let password = ''
  let response = undefined

  while (!gotResponse && retryCount < MAX_RETRIES) {
    try {
      const credentials = await getAdminCredentialsFromEnv(host)
      username = credentials[0] || ''
      password = credentials[1] || ''

      const cancelTokenSource = axios.CancelToken.source()
      response = await axios.request({
        method: 'POST',
        url: '/login',
        baseURL: 'https://' + host + '/_matrix/client/r0',
        headers: undefined,
        data: {
          type: 'm.login.password',
          identifier: {
            type: 'm.id.user',
            user: username
          },
          password: password,
          device_id: 'teastdevice'
        },
        cancelToken: cancelTokenSource.token
      })
      gotResponse = true
    } catch (error) {
      if (retryCount == MAX_RETRIES) {
        console.log(new Date(), ' retry getAdminResponse for too many times ', retryCount)

        throw error
      }
      retryCount++
    }
  }

  return response
}

export async function getCreateRoomResponse(
  seed: string,
  token?: string,
  host: string = 'beacon-node-1.sky.papers.tech',
  roomName: string = 'TESTroom1'
): Promise<any> {
  console.log(new Date(), host, 'getCreateRoomResponse')

  if (token === undefined) {
    const loginResponse = await getLoginResponse(seed, host)
    token = loginResponse.data.access_token
  }

  let response: AxiosResponse<any>

  try {
    response = await makeRequest(
      host,
      '/createRoom',
      'POST',
      {
        room_version: '5', // specified in the sdk as well (compatibility issue)
        room_alias_name: roomName,
        room_name: roomName,
        preset: 'trusted_private_chat',
        invite: []
      },
      token || 'no_token'
    )
  } catch (axiosError) {
    throw (axiosError as AxiosError).response
  }

  return response
}

export async function getSendMsgResponse(accessToken: string, node: string, roomId: string) {
  console.log(new Date(), node, 'getSendMsgResponse')

  let response: AxiosResponse<any>

  try {
    response = await makeRequest(
      node,
      `/rooms/${encodeURIComponent(roomId)}/send/m.room.message`,
      'POST',
      { msgtype: 'm.text', body: 'hello' },
      accessToken
    )
  } catch (axiosError) {
    throw (axiosError as AxiosError).response?.data || (axiosError as AxiosError).response
  }

  // TODO: also check for message to be there?
  return response
}

export async function getUsers(node: string, from = 0, limit = 0, token?: string) {
  if (token === undefined) {
    let loginResponse: any
    try {
      loginResponse = await getAdminLoginResponse(node)
      token = loginResponse.data.access_token
    } catch (error) {
      return 0
    }
  }

  let response: AxiosResponse<any>
  response = await makeRequest(
    node,
    '/_synapse/admin/v2/users?from=' + from + '&limit=' + limit + '&guests=false',
    'GET',
    {},
    token || 'no_token',
    ''
  )

  return response.data
}

export async function getUserDevices(node: string, userId: string, token?: string) {
  if (token === undefined) {
    let loginResponse: any
    try {
      loginResponse = await getAdminLoginResponse(node)
      token = loginResponse.data.access_token
    } catch (error) {
      return { devices: [] }
    }
  }

  let response: AxiosResponse<any>
  response = await makeRequest(
    node,
    '_synapse/admin/v2/users/' + userId + '/devices',
    'GET',
    {},
    token || 'no_token',
    ''
  )

  return response.data
}

export async function getRoomsOfUser(node: string, userId: string, token?: string) {
  if (token === undefined) {
    let loginResponse: any
    try {
      loginResponse = await getAdminLoginResponse(node)
      token = loginResponse.data.access_token
    } catch (error) {
      return { rooms: [] }
    }
  }

  let response: AxiosResponse<any> | undefined
  let retry = true
  const maxRetries = 5
  let retryCount = 0
  while (retry && retryCount <= maxRetries) {
    try {
      retry = false
      response = await makeRequest(
        node,
        '/_synapse/admin/v1/users/' + userId + '/joined_rooms',
        'GET',
        {},
        token || 'no_token',
        ''
      )
    } catch (error) {
      console.log(new Date(), ' retrying joined rooms ', retryCount)
      retry = true
      retryCount++
    }
  }

  return response?.data || { joined_rooms: [] }
}

export async function getUserCount(node: string, token?: string) {
  if (token === undefined) {
    let loginResponse: any
    try {
      loginResponse = await getAdminLoginResponse(node)
      token = loginResponse.data.access_token
    } catch (error) {
      return 0
    }
  }

  let response: AxiosResponse<any>
  response = await makeRequest(
    node,
    '/_synapse/admin/v2/users?from=0&limit=10&guests=false',
    'GET',
    {},
    token || 'no_token',
    ''
  )

  return response.data.total
}

export const ROOMS_LIMIT = 1000

export async function getRoomCounts(node: string, token?: string) {
  console.log(new Date(), node, 'getRoomCount')
  if (token === undefined) {
    let loginResponse: any
    try {
      loginResponse = await getAdminLoginResponse(node)
      token = loginResponse.data.access_token
    } catch (error) {
      return []
    }
  }

  let response: AxiosResponse<any>
  const limit = ROOMS_LIMIT
  const offset = 0
  const testRoomCount = 0
  const normalRoomCount = 0

  response = await makeRequest(
    node,
    '/_synapse/admin/v1/rooms?from=' + offset + '&limit=' + limit + '&order_by=canonical_alias',
    'GET',
    {},
    token || 'no_token',
    ''
  )

  return [testRoomCount, normalRoomCount, response.data.total_rooms]
}

export async function getCreatedAtTimestamp(node: string, roomId: string, token?: string) {
  const roomStates = await getRoomStates(node, roomId, token)

  for (const state of roomStates) {
    if (state.type === 'm.room.create') {
      return state.origin_server_ts
    }
  }
}

async function getRoomStates(node: string, roomId: string, token?: string) {
  if (token === undefined) {
    let loginResponse: any
    try {
      loginResponse = await getAdminLoginResponse(node)
      token = loginResponse.data.access_token
    } catch (error) {
      return []
    }
  }

  let response: AxiosResponse<any>

  response = await makeRequest(
    node,
    '/_synapse/admin/v1/rooms/' + roomId + '/state',
    'GET',
    {},
    token || 'no_token',
    ''
  )

  return response.data.state
}

export async function getRooms(node: string, token?: string, count = false, from = 0, all = true) {
  if (token === undefined) {
    let loginResponse: any
    try {
      loginResponse = await getAdminLoginResponse(node)
      token = loginResponse.data.access_token
    } catch (error) {
      return []
    }
  }

  let response: AxiosResponse<any>
  let limit = ROOMS_LIMIT
  let retries = 0
  while (true) {
    try {
      response = await makeRequest(
        node,
        '/_synapse/admin/v1/rooms?limit=' + limit + '&from=' + from,
        'GET',
        {},
        token || 'no_token',
        ''
      )
    } catch (axiosError) {
      retries++
      if (retries > 20) {
        throw (axiosError as AxiosError).response
      }
      console.log('retrying getting rooms ', node, limit, from)
      await delay(20)
      continue
    }

    if (count) {
      return response.data.total_rooms
    }

    if (all) {
      if (response.data.total_rooms !== response.data.rooms.length) {
        limit = response.data.total_rooms + 5
      } else {
        break
      }
    } else {
      break
    }
  }

  return response.data.rooms
}

export async function removeUser(node: string, userId: string, token?: string) {
  if (token === undefined) {
    let loginResponse: any
    try {
      loginResponse = await getAdminLoginResponse(node)
      token = loginResponse.data.access_token
    } catch (error) {
      console.log('removeUserError', error)

      return
    }
  }
  try {
    await makeRequest(
      node,
      '/_synapse/admin/v1/deactivate/' + userId,
      'POST',
      {
        erase: true
      },
      token || 'no_token',
      ''
    )
  } catch (axiosError) {
    throw (axiosError as AxiosError).response
  }
}

export async function removeRoom(node: string, roomId: string, token?: string) {
  if (token === undefined) {
    let loginResponse: any
    try {
      loginResponse = await getAdminLoginResponse(node)
      token = loginResponse.data.access_token
    } catch (error) {
      console.log('removeRoomError')

      return
    }
  }

  try {
    await makeRequest(
      node,
      '/_synapse/admin/v1/rooms/' + roomId,
      'DELETE',
      {
        block: true,
        purge: true
      },
      token || 'no_token',
      ''
    )
  } catch (axiosError) {
    console.log('removeRoomError2')

    throw (axiosError as AxiosError).response
  }
}

export async function totalRooms(node: string, token?: string) {
  if (token === undefined) {
    let loginResponse: any
    try {
      loginResponse = await getAdminLoginResponse(node)
      token = loginResponse.data.access_token
    } catch (error) {
      console.log('totalRoomsError')

      return []
    }
  }

  let response: AxiosResponse<any>
  const limit = 10
  try {
    response = await makeRequest(
      node,
      '/_synapse/admin/v1/rooms?limit=' + limit,
      'GET',
      {},
      token || 'no_token',
      ''
    )
  } catch (axiosError) {
    console.log('totalRoomsError2')
    throw (axiosError as AxiosError).response
  }
  return response.data.total_rooms
}

export async function roomState(node: string, roomId: string, token?: string) {
  if (token === undefined) {
    let loginResponse: any
    try {
      loginResponse = await getAdminLoginResponse(node)
      token = loginResponse.data.access_token
    } catch (error) {
      console.log('roomStateError')
      return loginResponse
    }
  }

  let response: AxiosResponse<any>
  try {
    response = await makeRequest(
      node,
      '/_synapse/admin/v1/rooms/' + roomId + '/state',
      'GET',
      {},
      token || 'no_token',
      ''
    )
  } catch (axiosError) {
    console.log('roomStateError2')

    throw (axiosError as AxiosError).response
  }
  return response
}

async function makeRequest(
  host: string,
  path: string,
  requestMethod: Method,
  requestData: any,
  accessToken?: string,
  baseUrlPath?: string
) {
  const cancelTokenSource = axios.CancelToken.source()
  if (baseUrlPath === undefined) {
    baseUrlPath = '/_matrix/client/r0'
  }

  return axios.request({
    method: requestMethod,
    url: path,
    baseURL: 'http://' + host + baseUrlPath,
    headers: {
      Authorization: 'Bearer ' + accessToken
    },
    data: requestData,
    cancelToken: cancelTokenSource.token
  })
}
