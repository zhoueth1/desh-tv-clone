import { GraphQLClient } from 'graphql-request';

const host = (process.env.NEXT_PUBLIC_HOST_URL || 'http://localhost:3000').replace(
  /\/$/,
  ''
);

export const client = new GraphQLClient(
  typeof window === 'undefined'
    ? `${host}/api/graphql`
    : new URL('/api/graphql', window.location.origin).href
);
