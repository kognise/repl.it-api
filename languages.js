const fetch = require('node-fetch')
const fs = require('fs')

fetch('https://eval.repl.it/languages').then((response) => response.json()).then((languages) => {
  const languageString = languages.map(({ name, displayName }) => ` - ${displayName}: \`${name}\``).join('\n')
  const markdown = `
# Supported Languages

*This file was generated automatically by \`languages.js\`.*

 - HTML/JS/CSS: \`html\`
${languageString}
  `.trim()
  fs.writeFileSync('LANGUAGES.md', markdown)
})