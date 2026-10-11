import { list } from '@keystone-6/core';
import { allowAll } from '@keystone-6/core/access';
import { text, image, timestamp, integer } from '@keystone-6/core/fields';
import { imageStorage, resolveImageData } from '../storage';

function buildSlug(input: string) {
  return '/poll/' + input.trim().toLowerCase().replace(/[^\w ]+/g, '').replace(/ +/g, '-').substring(0, Math.min(input.length, 374));
}

const voteField = (required: boolean) => integer({
  defaultValue: 0,
  validation: { isRequired: required },
  ui: { createView: { fieldMode: 'hidden' } },
});

export default list({
  access: allowAll,
  graphql: { plural: 'Polls' },
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
    yes_count: voteField(true),
    no_count: voteField(true),
    no_comment_count: voteField(true),
    desh_yes_count: voteField(false),
    desh_no_count: voteField(false),
    desh_no_comment_count: voteField(false),
  },
});
