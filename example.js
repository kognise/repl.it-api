const ReplitClient = require('./lib')
const client = new ReplitClient()

client.create().then(() => {
  console.log('Created')
  return client.connect()
}).then(() => {
  console.log('Connected')
  return client.writeMain('require(\'express\')().listen()')
}).then(() => {
  console.log('Wrote')
  return client.run({
    output: (output) => console.log('Output:', output.trim()),
    timedOut: () => console.log('Timed out!'),
    installStart: () => console.log('Install start'),
    installOutput: (output) => console.log('Install output:', output.trim()),
    installEnd: () => console.log('Install end'),
    listen: (port) => console.log('Listening on port', port)
  })
}).then((result) => {
  console.log('Result:', result)
  return client.close()
}).then(() => {
  console.log(client.getInfo())
})