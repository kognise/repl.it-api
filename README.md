# Repl.it API

*A Node.js client for creating projects and executing code on [Repl.it](https://repl.it/).*

[![NPM Version](https://img.shields.io/npm/v/repl.it-api.svg?style=for-the-badge)](https://npm.im/repl.it-api)

## Installation

With Yarn:

```
$ yarn add repl.it-api
```

With NPM:

```
$ npm install repl.it-api
```

## Documentation

All of the asyncronous code in the documentation below will be expressed async/await syntax, it works equally well with Promises.

### Instantiate a Client

Before doing anything else you have to import `repl.it-api` and create a Repl.it client.

```javascript
const ReplitClient = require('repl.it-api')
const client = new ReplitClient()
```

`ReplitClient`'s constructor takes one argument: a number (in milliseconds) which is the timeout for code execution. The default is `3000`.

### Create a Project & Connect

You have to create a project, and connect to Repl.it's websocket to execute code and write files in.

```javascript
await client.create()
await client.connect()
```

`client#create` takes one argument: a string that should be a valid language. The default is `nodejs`.

### Write to a File

```javascript
await client.write('file.js', 'console.log("Hello, world!")')
```

You can also write to the main file, which is the file that is executed by Repl.it.

```javascript
await client.writeMain('console.log("Hello from the main file")')
```

`client#write` takes two arguments:

1. A string that should be the file name or path to the file. Please don't include a slash or `./` at the beginning.
2. A string for the actial file content.

`client#writeMain` only takes one argument, which is the same as the second argument to `client#write`.

### Run the Project

Now you probably want to actually run your project!

```javascript
const result = await client.run({
  output: (output) => console.log('Output:', output.trim()),
  timedOut: () => console.log('Timed out!'),
  installStart: () => console.log('Install start'),
  installOutput: (output) => console.log('Install output:', output.trim()),
  installEnd: () => console.log('Install end'),
  listen: (port) => console.log('Listening on port', port)
})
```

`client#run` takes one argument that should be an object with a bunch event listeners, all documented below. They are all optional.

- `output`: fired when the program outputs text, has one argument: a string containing the output. You may want to trim the whitespace.
- `timedOut`: fired when the program execution times out. This timeout period **does not include** package installation time.
- `installStart`: fired when package installation begins. This will only happen when there are packages that need to be installed.
- `installOutput`: fired when package installation outputs text, has one argument: a string containing the output. You may want to trim the whitespace.
- `installEnd`: fired when package installation finishes.
- `installOutput`: fired when program listens on a port, has one argument: a number containing the port. You may want to trim the whitespace.

`client#run` will also resolve with the output of the program which will most likely be `'undefined'`. Also, note that when the project either times out or listens on a port it resolves immediately.

### Close the Connection

We **super ultra very much recommend** doing this before exiting your program. It's as simple as the below code.

```javascript
await client.close()
```

### Get Project Info

```javascript
const info = await client.getInfo()
```

`info` will be an object in the following format:

```javascript
{
  id: '7ab11c71-5efd-4b31-9136-686573e2455d',
  url: 'https://repl.it/repls/FastFlakyProblems',
  slug: 'FastFlakyProblems',
  language: 'nodejs'
}
```

Of course, your values will be different.