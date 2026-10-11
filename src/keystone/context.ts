import { getContext } from '@keystone-6/core/context';
import config from '../../keystone';
import * as PrismaModule from '../../generated/prisma/client';

// Making sure multiple prisma clients are not created during dev hot reloading
const shared = globalThis as typeof globalThis & {
  keystoneContext?: ReturnType<typeof getContext>;
};

export const keystoneContext = shared.keystoneContext || getContext(config, PrismaModule);

export const prisma = keystoneContext.prisma;

if (process.env.NODE_ENV !== 'production') {
  shared.keystoneContext = keystoneContext;
}
