import express from '../express_lb/express'
import http, { IncomingMessage, ServerResponse  } from 'http'

const app = new express()

app.get('/', (req: IncomingMessage, res: ServerResponse) => {
  console.log('😄 --- get')
  res.writeHead(200)
  res.write('Hello world')
  res.end()
})

app.listen(3000, () => console.log('🐱 Example app listening on port 3000~'))



