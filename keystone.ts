// Welcome to Keystone!
//
// This file is what Keystone uses as the entry-point to your headless backend
//
// Keystone imports the default export of this file, expecting a Keystone configuration object
//   you can find out more at https://keystonejs.com/docs/apis/config

import { config, g } from '@keystone-6/core';
import { PrismaPg } from '@prisma/adapter-pg';
import { databasePoolConfig } from './src/keystone/database';
import { storedImage } from './src/keystone/storage';

// to keep this file tidy, we define our schema in a different file
import { lists } from './src/keystone/schema';

// authentication is configured separately here too, but you might move this elsewhere
// when you write your list-level access control functions, as they typically rely on session data

export default config({
  db: {
    provider: 'postgresql',
    prismaClientOptions: () => ({
      adapter: new PrismaPg(databasePoolConfig()),
      log: ['warn', 'error'],
    }),
    // Keep the original relation mode and integer IDs.
    extendPrismaSchema: schema => schema.replace(
      'provider = "postgresql"',
      'provider = "postgresql"\n  relationMode = "prisma"'
    ),
    idField: { kind: 'autoincrement' },
  },
  ui: { basePath: '/admin' },
  lists,
  server: {
    extendExpressApp: app => {
      app.use('/images', async (req, res, next) => {
        if (req.method !== 'GET' && req.method !== 'HEAD') return next();
        try {
          const { bytes, contentType } = await storedImage(decodeURIComponent(req.path.slice(1)));
          res.setHeader('Content-Type', contentType);
          res.setHeader('Content-Length', bytes.length);
          res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
          res.end(req.method === 'HEAD' ? undefined : bytes);
        } catch {
          next();
        }
      });
    },
  },
  graphql: {
    extendGraphqlSchema: g.extend(base => ({
      mutation: {
        votePoll: g.field({
          type: base.object('Poll'),
          args: {
            slug: g.arg({ type: g.nonNull(g.String) }),
            option: g.arg({ type: g.nonNull(g.String) }),
          },
          async resolve(_source, { slug, option }, context) {
            const fields = { yes: 'yes_count', no: 'no_count', 'no-comment': 'no_comment_count' };
            const field = fields[option];
            if (!field) throw new Error('Choose yes, no, or no-comment.');
            const poll = await context.prisma.poll.update({
              where: { slug },
              data: { [field]: { increment: 1 } },
            });
            return context.db.Poll.findOne({ where: { id: String(poll.id) } });
          },
        }),
      },
    })),
  },
});
