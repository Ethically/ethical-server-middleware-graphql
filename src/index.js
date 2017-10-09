import { graphql, buildSchema } from 'graphql'

const graphqlMiddleware = async (ctx, next, config) => {

    const { path, schema, root } = config
    const { method, request, response } = ctx
    const { path: requestedPath } = request
    const isJSON = request.is('application/json')
    if (path !== requestedPath || method !== 'POST' || !isJSON) {
        return await next()
    }

    const { query, variables } = request.body
    const graphqlSchema = buildSchema(schema)
    const result = await graphql(graphqlSchema, query, root, ctx, variables)

    response.body = JSON.stringify(result)

    await next()
}

const graphqlMiddlewareInit = config => (
    async (ctx, next) => await graphqlMiddleware(ctx, next, config)
)

export default graphqlMiddlewareInit
