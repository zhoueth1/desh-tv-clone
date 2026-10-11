import { createYoga } from 'graphql-yoga';
import { isScalarType } from 'graphql';
import { Readable } from 'node:stream';
import type { NextApiRequest, NextApiResponse } from 'next';
import { keystoneContext } from '../../src/keystone/context';

// Yoga supplies WHATWG File objects; Keystone's image field consumes Node streams.
const uploadScalar = keystoneContext.graphql.schema.getType('Upload');
if (isScalarType(uploadScalar)) {
  const parseUpload = uploadScalar.parseValue.bind(uploadScalar);
  uploadScalar.parseValue = value => {
    const file = value as Partial<File> | undefined;
    if (file && typeof file.stream === 'function' && typeof file.arrayBuffer === 'function') {
      return Promise.resolve({
        filename: file.name || 'upload',
        mimetype: file.type || 'application/octet-stream',
        encoding: '7bit',
        createReadStream: () => Readable.fromWeb(file.stream() as any),
      });
    }
    return parseUpload(value);
  };
}

/*
  An example of how to setup your own yoga graphql server
  using the generated Keystone GraphQL schema.
*/
export const config = {
  api: {
    // Disable body parsing (required for file uploads)
    bodyParser: false,
  },
};

// Use Keystone API to create GraphQL handler
export default createYoga<{
  req: NextApiRequest;
  res: NextApiResponse;
}>({
  graphqlEndpoint: '/api/graphql',
  schema: keystoneContext.graphql.schema,
  /*
    `keystoneContext` object doesn't have user's session information.
    You need an authenticated context to CRUD data behind access control.
    keystoneContext.withRequest(req, res) automatically unwraps the session cookie
    in the request object and gives you a `context` object with session info
    and an elevated sudo context to bypass access control if needed (context.sudo()).
  */
  context: ({ req, res }) => keystoneContext.withRequest(req, res),
});
