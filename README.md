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

**Due to an incident that involved API abuse, anonymous repls now require a capture to be managed. I am currently working with @amasad (the owner of Repl.it) on making that work with this API but until then you must log in.**

### Instantiate a Client

Before doing anything else you have to import `repl.it-api` and create a Repl.it client.

```javascript
const ReplitClient = require('repl.it-api')
const client = new ReplitClient()
```

`ReplitClient`'s constructor takes one argument: a number (in milliseconds) which is the timeout for code execution. The default is `3000`.
### Login
To login to repl.it with the api run the piece of code under this paragraph replace username and password with your usernmae and password
```javascript
await client.login("username","password")
```
### Create a Project & Connect

You have to create a project, and connect to Repl.it's websocket to execute code and write files in.

You don't have to perform the connection for web repls, although it won't throw an error.

```javascript
await client.create()
await client.connect()
```

`client#create` takes one argument: a string that should be a valid language. The default is `nodejs`. See a full list of languages [here](https://github.com/kognise/repl.it-api/blob/master/LANGUAGES.md)!

### Load from a Path

Instead of creating a new project, you may want to load an existing project. Currently we support loading from a path like `@User/Repl-Name`.

```javascript
await client.loadFromPath('@User/Repl-Name')
```

`client#loadFromPath` takes one argument: a string that should be the file path.

Also note that if you do not have write access to that project, you will only be able to read from files.

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

### Read from a File

```javascript
const content = await client.read('file.js')
```

You can also read from the main file.

```javascript
const content = await client.readMain()
```

`client#read` takes one argument: a string that should be the filename.

### List All Files

You can also list all the files in a project. **Note that it'll return a flat array in a weird format!** Due to limitations of Google Cloud Storage, the file heirarchy is flattened.

Say the file heirarchy *seems* like this:

```
/
|-- index.js
|-- lib/
|   |-- blah.js
|   |-- other.js
```

This is how it'll actually be stored:

```javascript
[ 'index.js', 'lib/blah.js', 'lib/other.js' ]
```

Without further ado, below is the usage example.

```javascript
const files = await client.list()
```

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

### Log In

If you want, you can create repls under your account by logging in. You have to get the cookie `connect.sid` from your browser, and save that somewhere super safe. **Don't store it anywhere public, including Git!**

```javascript
await client.login(sid)
```

`client#login` takes one argument: a string which should be the `connect.sid` cookie's value.

### Close the Connection

We **super ultra very much recommend** doing this before exiting your program. It's as simple as the below code.

You don't need to do this for web repls.

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
