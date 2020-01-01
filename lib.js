const { CookieJar, Cookie } = require('tough-cookie')
const nodeFetch = require('node-fetch')
const fetchCookie = require('fetch-cookie')
const WebSocketClient = require('websocket').client

const parseJson = (response) => response.json()
const sendJson = (connection, json) => connection.sendUTF(JSON.stringify(json))
const headers = {
  'Referer': 'https://repl.it/',
  'Content-Type': 'application/json'
}

module.exports = class {
  constructor(timeout = 5000) {
    this.got = {}
    this.jar = new CookieJar()
    this.fetch = fetchCookie(nodeFetch, this.jar)
    this.timeout = timeout
  }
  async login(username,password){
    await this.fetch('https://repl.it/login',{
      method: 'POST', 
      body:  { username, password },
      headers
    }).then((response)=>{
      response.json()
      if(response.username === username){
        this.cookies = response.headers.get('set-cookie')
        headers.Cookie = response.headers.get('set-cookie')
      }
    })
  }
  async create(language = 'nodejs') {
    const { id, url, fileNames, slug } = await this.fetch('https://repl.it/data/repls/new', {
      method: 'POST',
      body: JSON.stringify({ language }),
      headers
    }).then(parseJson)
    this.got.id = id
    this.got.url = url
    this.got.slug = slug
    this.got.language = language
    this.got.mainFile = fileNames[0]

    const potentialToken = await this.fetch(`https://repl.it/data/repls/${id}/gen_repl_token`, {
      method: 'POST',
      body: JSON.stringify({
        liveCodingToken: null,
        polygott: false
      }),
      headers
    }).then(parseJson)
    if (potentialToken.message) {
      if (potentialToken.name) {
        throw new Error(`${potentialToken.name}: ${potentialToken.message}`)
      } else {
        throw new Error(potentialToken.message)
      }
    } else {
      this.got.token = potentialToken
    }
  }

  async loadFromPath(path) {
    const { id, url, fileNames, slug, language } = await this.fetch(`https://repl.it/data/repls/${path}`).then(parseJson)
    this.got.id = id
    this.got.url = url
    this.got.slug = slug
    this.got.language = language
    this.got.mainFile = fileNames[0]
    const potentialToken = await this.fetch(`https://repl.it/data/repls/${id}/gen_repl_token`, {
      method: 'POST',
      body: JSON.stringify({
        liveCodingToken: null,
        polygott: false
      }),
      headers
    }).then(parseJson)
    if (potentialToken.message) {
      if (potentialToken.name) {
        throw new Error(`${potentialToken.name}: ${potentialToken.message}`)
      } else {
        throw new Error(potentialToken.message)
      }
    } else {
      this.got.token = potentialToken
    }
  }

  login(sid) {
    const cookie = Cookie.fromJSON({
      key: 'connect.sid',
      value: sid,
      domain: 'repl.it',
      path: '/'
    })
    return new Promise((resolve, reject) => {
      this.jar.setCookie(cookie, 'https://repl.it/', (error) => {
        if (error) return reject(error)
        resolve()
      })
    })
  }

  async connect() {
    if (this.got.language === 'html') return Promise.resolve()

    const connection = await new Promise((resolve, reject) => {
      const client = new WebSocketClient()
  
      client.on('connectFailed', (error) => {
        reject(error)
      })
  
      client.on('connect', (connection) => {
        resolve(connection)
      })
  
      client.connect('wss://eval.repl.it/ws')
    })
    await new Promise((resolve, reject) => {
      sendJson(connection, {
        command: 'auth',
        data: this.got.token
      })
      connection.on('message', ({ type, utf8Data }) => {
        if (type !== 'utf8') return
        const { command, data } = JSON.parse(utf8Data)
        if (command === 'error') reject(new Error(data))
        if (command === 'ready') resolve()
      })

      connection.on('close', () => reject(new Error('Closed too early')))
    })
    this.got.connection = connection
  }

  async write(name, content) {
    const json = await this.fetch(`https://repl.it/data/repls/signed_urls/${this.got.id}/${encodeURIComponent(name)}?d=${Date.now()}`).then(parseJson)
    const writeUrl = json.urls_by_action.write
    await this.fetch(writeUrl, {
      method: 'PUT',
      body: content,
      headers: {
        'Content-Type': ''
      }
    })
  }

  writeMain(content) {
    return this.write(this.got.mainFile, content)
  }

  async read(name) {
    const json = await this.fetch(`https://repl.it/data/repls/signed_urls/${this.got.id}/${encodeURIComponent(name)}?d=${Date.now()}`).then(parseJson)
    const readUrl = json.urls_by_action.read
    const content = await this.fetch(readUrl, {
      method: 'GET'
    }).then((response) => response.text())
    return content
  }

  readMain() {
    return this.read(this.got.mainFile)
  }

  async list() {
    const { fileNames } = await this.fetch(`https://repl.it/data/repls${this.got.url}`).then(parseJson)
    return fileNames
  }

  async run(listeners = {}) {
    const { output, timedOut, listen, installStart, installOutput, installEnd } = listeners

    if (this.got.language === 'html') {
      const { url } = await this.fetch('https://replbox.repl.it/data/web_project/pushroute', {
        method: 'POST',
        body: JSON.stringify({
          replId: this.got.id
        }),
        headers
      }).then(parseJson)
      await this.fetch(`https://repl.it${url}`)
      listen && listen(80)
      return Promise.resolve()
    }

    let alreadyLeft = false
    let timeout

    return new Promise((resolve) => {
      const timeoutAmount = this.timeout
      function setTheTimeout() {
        timeout = setTimeout(() => {
          if (alreadyLeft) return
          alreadyLeft = true
          timedOut && timedOut()
          resolve()
        }, timeoutAmount)
      }

      sendJson(this.got.connection, {
        command: 'runProject',
        data: '[]'
      })
      setTheTimeout()
      this.got.connection.on('message', ({ type, utf8Data }) => {
        if (type !== 'utf8') return
        const { command, data } = JSON.parse(utf8Data)

        if (command === 'event:packageInstallStart') {
          clearTimeout(timeout)
          installStart && installStart()
        } else if (installOutput && command === 'event:packageInstallOutput') {
          installOutput(data)
        } else if (command === 'event:packageInstallEnd') {
          setTheTimeout()
          installEnd && installEnd()
        } else if (output && command === 'output') {
          output(data)
        } else if (command === 'result' && !alreadyLeft) {
          alreadyLeft = true
          resolve(data)
        } else if (command === 'event:portOpen') {
          const { port } = JSON.parse(data)
          alreadyLeft = true
          listen && listen(port)
          resolve()
        }
      })
    })
  }

  close() {
    if (this.got.language === 'html') return Promise.resolve()
    return new Promise((resolve) => {
      this.got.connection.close()
      this.got.connection.on('close', () => {
        resolve()
      })
    })
  }

  getInfo() {
    return {
      id: this.got.id,
      url: `https://repl.it${this.got.url}`,
      slug: this.got.slug,
      language: this.got.language
    }
  }
}
