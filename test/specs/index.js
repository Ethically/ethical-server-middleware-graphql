import fetch from 'node-fetch'
import { graphql, buildSchema } from 'graphql'
import ethicalServer from 'ethical-utility-server'
import postDataMiddleware from 'ethical-server-middleware-post-data'
import jsonMiddleware from 'ethical-server-middleware-json'
import graphqlMiddleware from '../../src/index.js'

const baseURL = 'http://localhost:8080'
const query = '{ hello }'
const schema = `
    type Query {
        hello: String
    }
`
const root = {
    hello: () => 'Hello world!'
}
const path = '/graphql'
const mockQuery = JSON.stringify({ query })
const config = { schema, root, path }
const startServer = ({
    request = () => {},
    beforeMiddleware =  async (ctx, next) => await next()
}) => (
    ethicalServer()
    .use(postDataMiddleware())
    .use(jsonMiddleware())
    .use(beforeMiddleware)
    .use(graphqlMiddleware(config))
    .listen()
    .then(destroyServer => {
        return new Promise(async resolve => {
            await request()
            resolve(destroyServer)
        })
    })
    .then(destroyServer => destroyServer())
)

describe('graphqlMiddleware()', () => {
    it('should execute graphql queries', (done) => {
        const request = async () => {
            const headers = {
                'Content-Type': 'application/json'
            }
            const config = { method: 'POST', body: mockQuery, headers }
            const response = await fetch(baseURL + '/graphql', config)
            const data = await response.json()
            expect(data).toEqual({ data: { hello: 'Hello world!' } })
        }

        startServer({ request })
        .then(done)
        .catch(e => console.error(e))
    })
    it('should bypass the middleware when path is incorrect', (done) => {
        const request = async () => {
            const headers = {
                'Content-Type': 'application/json'
            }
            const config = { method: 'POST', body: mockQuery, headers }
            const response = await fetch(baseURL + '/noop', config)
            const data = await response.text()
            expect(data).toEqual('Not Found')
        }

        startServer({ request })
        .then(done)
        .catch(e => console.error(e))
    })
    it('should bypass the middleware when method is not POST', (done) => {
        const request = async () => {
            const headers = {
                'Content-Type': 'application/json'
            }
            const config = { method: 'GET', headers }
            const response = await fetch(baseURL + '/graphql', config)
            const data = await response.text()
            expect(data).toEqual('Not Found')
        }

        startServer({ request })
        .then(done)
        .catch(e => console.error(e))
    })
    it('should bypass the middleware when request content type is not JSON', (done) => {
        const request = async () => {
            const headers = {
                'Content-Type': 'text/plain'
            }
            const config = { method: 'POST', body: mockQuery, headers }
            const response = await fetch(baseURL + '/graphql', config)
            const data = await response.text()
            expect(data).toEqual('Not Found')
        }

        startServer({ request })
        .then(done)
        .catch(e => console.error(e))
    })
})
