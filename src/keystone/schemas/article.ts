import { list } from '@keystone-6/core';
import { allowAll } from '@keystone-6/core/access';
import { text, relationship, image, timestamp } from '@keystone-6/core/fields';
import { document } from '@keystone-6/fields-document';
import { imageStorage, resolveImageData } from '../storage';

function buildSlug(input: string) {
  return '/article/' + input.trim().toLowerCase().replace(/[^\w ]+/g, '').replace(/ +/g, '-');
}

export default list({
  access: allowAll,
  graphql: { plural: 'Articles' },
  fields: {
    slug: text({
      hooks: {
        resolveInput: ({ operation, resolvedData, inputData }) => {
          if (operation === 'create' && !inputData.slug) return buildSlug(inputData.title);
          return resolvedData.slug;
        },
      },
      ui: { createView: { fieldMode: 'hidden' } },
      db: { nativeType: 'VarChar(380)' },
      isIndexed: 'unique',
    }),
    image: image({ storage: imageStorage }),
    image_data: text({
      db: { nativeType: 'Text', isNullable: true },
      hooks: { resolveInput: resolveImageData },
      ui: { createView: { fieldMode: 'hidden' } },
      validation: { isRequired: false },
    }),
    title: text({ isIndexed: 'unique', validation: { isRequired: true } }),
    translated_date: timestamp({ validation: { isRequired: true } }),
    created_at: timestamp({ defaultValue: { kind: 'now' }, validation: { isRequired: true } }),
    content: document({
      formatting: true,
      layouts: [[1, 1], [1, 1, 1], [2, 1], [1, 2], [1, 2, 1]],
      links: true,
      dividers: true,
    }),
    category: relationship({
      ref: 'Category.articles',
      ui: { hideCreate: false, displayMode: 'select' },
      many: false,
    }),
    recommendedArticles: relationship({
      ref: 'Article',
      ui: { hideCreate: false, displayMode: 'select' },
      many: true,
    }),
  },
});
