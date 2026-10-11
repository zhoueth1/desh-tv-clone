var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// keystone.ts
var keystone_exports = {};
__export(keystone_exports, {
  default: () => keystone_default
});
module.exports = __toCommonJS(keystone_exports);
var import_core5 = require("@keystone-6/core");
var import_adapter_pg = require("@prisma/adapter-pg");

// src/keystone/database.ts
function databasePoolConfig() {
  return {
    connectionString: process.env.DATABASE_URL,
    max: 5,
    connectionTimeoutMillis: 1e4,
    idleTimeoutMillis: 3e4
  };
}

// src/keystone/storage.ts
var import_promises = require("node:fs/promises");
var import_node_path = __toESM(require("node:path"));
var imageDirectory = import_node_path.default.resolve(process.cwd(), "public/images");
function imagePath(key) {
  if (!/^[A-Za-z0-9_-]+\.[A-Za-z0-9]+$/.test(key)) {
    throw new Error("Invalid image storage key.");
  }
  return import_node_path.default.join(imageDirectory, key);
}
var imageStorage = {
  async put(key, stream) {
    await (0, import_promises.mkdir)(imageDirectory, { recursive: true });
    await (0, import_promises.writeFile)(imagePath(key), stream);
  },
  async delete(key) {
    await (0, import_promises.unlink)(imagePath(key)).catch((error) => {
      if (error.code !== "ENOENT") throw error;
    });
  },
  url(key) {
    const baseUrl = process.env.BASE_URL || process.env.NEXT_PUBLIC_HOST_URL || "http://localhost:3000";
    return `${baseUrl.replace(/\/$/, "")}/images/${encodeURIComponent(key)}`;
  }
};
async function resolveImageData({ resolvedData, inputData, item }) {
  if (Object.prototype.hasOwnProperty.call(inputData, "image_data")) {
    return resolvedData.image_data;
  }
  if (!Object.prototype.hasOwnProperty.call(inputData, "image")) {
    return item?.image_data ?? null;
  }
  const uploaded = resolvedData.image;
  if (!uploaded?.id || !uploaded?.extension) return null;
  const bytes = await (0, import_promises.readFile)(imagePath(`${uploaded.id}.${uploaded.extension}`));
  const mime = uploaded.extension === "jpg" ? "jpeg" : uploaded.extension;
  return `data:image/${mime};base64,${bytes.toString("base64")}`;
}
async function storedImage(key) {
  const bytes = await (0, import_promises.readFile)(imagePath(key));
  const extension = import_node_path.default.extname(key).slice(1).toLowerCase();
  const contentTypes = { jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", gif: "image/gif", webp: "image/webp" };
  return { bytes, contentType: contentTypes[extension] || "application/octet-stream" };
}

// src/keystone/schemas/user.ts
var import_core = require("@keystone-6/core");
var import_access = require("@keystone-6/core/access");
var import_fields = require("@keystone-6/core/fields");
var user_default = (0, import_core.list)({
  // WARNING
  //   for this starter project, anyone can create, query, update and delete anything
  //   if you want to prevent random people on the internet from accessing your data,
  //   you can find out more at https://keystonejs.com/docs/guides/auth-and-access-control
  access: import_access.allowAll,
  // this is the fields for our User list
  fields: {
    // by adding isRequired, we enforce that every User should have a name
    //   if no name is provided, an error will be displayed
    name: (0, import_fields.text)({ validation: { isRequired: true } }),
    email: (0, import_fields.text)({
      validation: { isRequired: true },
      // by adding isIndexed: 'unique', we're saying that no user can have the same
      // email as another user - this may or may not be a good idea for your project
      isIndexed: "unique"
    }),
    password: (0, import_fields.password)({ validation: { isRequired: true } }),
    // we can use this field to see what Posts this User has authored
    //   more on that in the Post list below
    // posts: relationship({ ref: 'Post.author', many: true }),
    createdAt: (0, import_fields.timestamp)({
      // this sets the timestamp to Date.now() when the user is first created
      defaultValue: { kind: "now" }
    })
  }
});

// src/keystone/schemas/article.ts
var import_core2 = require("@keystone-6/core");
var import_access2 = require("@keystone-6/core/access");
var import_fields2 = require("@keystone-6/core/fields");
var import_fields_document = require("@keystone-6/fields-document");
function buildSlug(input) {
  return "/article/" + input.trim().toLowerCase().replace(/[^\w ]+/g, "").replace(/ +/g, "-");
}
var article_default = (0, import_core2.list)({
  access: import_access2.allowAll,
  graphql: { plural: "Articles" },
  fields: {
    slug: (0, import_fields2.text)({
      hooks: {
        resolveInput: ({ operation, resolvedData, inputData }) => {
          if (operation === "create" && !inputData.slug) return buildSlug(inputData.title);
          return resolvedData.slug;
        }
      },
      ui: { createView: { fieldMode: "hidden" } },
      db: { nativeType: "VarChar(380)" },
      isIndexed: "unique"
    }),
    image: (0, import_fields2.image)({ storage: imageStorage }),
    image_data: (0, import_fields2.text)({
      db: { nativeType: "Text", isNullable: true },
      hooks: { resolveInput: resolveImageData },
      ui: { createView: { fieldMode: "hidden" } },
      validation: { isRequired: false }
    }),
    title: (0, import_fields2.text)({ isIndexed: "unique", validation: { isRequired: true } }),
    translated_date: (0, import_fields2.timestamp)({ validation: { isRequired: true } }),
    created_at: (0, import_fields2.timestamp)({ defaultValue: { kind: "now" }, validation: { isRequired: true } }),
    content: (0, import_fields_document.document)({
      formatting: true,
      layouts: [[1, 1], [1, 1, 1], [2, 1], [1, 2], [1, 2, 1]],
      links: true,
      dividers: true
    }),
    category: (0, import_fields2.relationship)({
      ref: "Category.articles",
      ui: { hideCreate: false, displayMode: "select" },
      many: false
    }),
    recommendedArticles: (0, import_fields2.relationship)({
      ref: "Article",
      ui: { hideCreate: false, displayMode: "select" },
      many: true
    })
  }
});

// src/keystone/schemas/category.ts
var import_core3 = require("@keystone-6/core");
var import_access3 = require("@keystone-6/core/access");
var import_fields3 = require("@keystone-6/core/fields");
var category_default = (0, import_core3.list)({
  // WARNING
  //   for this starter project, anyone can create, query, update and delete anything
  //   if you want to prevent random people on the internet from accessing your data,
  //   you can find out more at https://keystonejs.com/docs/guides/auth-and-access-control
  access: import_access3.allowAll,
  // this is the fields for our Post list
  fields: {
    name: (0, import_fields3.text)({ validation: { isRequired: true } }),
    slug: (0, import_fields3.text)({ validation: { isRequired: true } }),
    // with this field, you can set a User as the author for a Post
    articles: (0, import_fields3.relationship)({
      // we could have used 'User', but then the relationship would only be 1-way
      ref: "Article.category",
      // this is some customisations for changing how this will look in the AdminUI
      ui: { hideCreate: false, displayMode: "select" },
      // a Post can only have one author
      //   this is the default, but we show it here for verbosity
      many: true
    })
  }
});

// src/keystone/schemas/poll.ts
var import_core4 = require("@keystone-6/core");
var import_access4 = require("@keystone-6/core/access");
var import_fields4 = require("@keystone-6/core/fields");
function buildSlug2(input) {
  return "/poll/" + input.trim().toLowerCase().replace(/[^\w ]+/g, "").replace(/ +/g, "-").substring(0, Math.min(input.length, 374));
}
var voteField = (required) => (0, import_fields4.integer)({
  defaultValue: 0,
  validation: { isRequired: required },
  ui: { createView: { fieldMode: "hidden" } }
});
var poll_default = (0, import_core4.list)({
  access: import_access4.allowAll,
  graphql: { plural: "Polls" },
  fields: {
    slug: (0, import_fields4.text)({
      hooks: {
        resolveInput: ({ operation, resolvedData, inputData }) => {
          if (operation === "create" && !inputData.slug) return buildSlug2(inputData.title);
          return resolvedData.slug;
        }
      },
      ui: { createView: { fieldMode: "hidden" } },
      db: { nativeType: "VarChar(380)" },
      isIndexed: "unique"
    }),
    image: (0, import_fields4.image)({ storage: imageStorage }),
    image_data: (0, import_fields4.text)({
      db: { nativeType: "Text", isNullable: true },
      hooks: { resolveInput: resolveImageData },
      ui: { createView: { fieldMode: "hidden" } },
      validation: { isRequired: false }
    }),
    title: (0, import_fields4.text)({ isIndexed: "unique", validation: { isRequired: true } }),
    translated_date: (0, import_fields4.timestamp)({ validation: { isRequired: true } }),
    created_at: (0, import_fields4.timestamp)({ defaultValue: { kind: "now" }, validation: { isRequired: true } }),
    yes_count: voteField(true),
    no_count: voteField(true),
    no_comment_count: voteField(true),
    desh_yes_count: voteField(false),
    desh_no_count: voteField(false),
    desh_no_comment_count: voteField(false)
  }
});

// src/keystone/schema.ts
var lists = {
  User: user_default,
  Article: article_default,
  Category: category_default,
  Poll: poll_default
};

// keystone.ts
var keystone_default = (0, import_core5.config)({
  db: {
    provider: "postgresql",
    prismaClientOptions: () => ({
      adapter: new import_adapter_pg.PrismaPg(databasePoolConfig()),
      log: ["warn", "error"]
    }),
    // Keep the original relation mode and integer IDs.
    extendPrismaSchema: (schema) => schema.replace(
      'provider = "postgresql"',
      'provider = "postgresql"\n  relationMode = "prisma"'
    ),
    idField: { kind: "autoincrement" }
  },
  ui: { basePath: "/admin" },
  lists,
  server: {
    extendExpressApp: (app) => {
      app.use("/images", async (req, res, next) => {
        if (req.method !== "GET" && req.method !== "HEAD") return next();
        try {
          const { bytes, contentType } = await storedImage(decodeURIComponent(req.path.slice(1)));
          res.setHeader("Content-Type", contentType);
          res.setHeader("Content-Length", bytes.length);
          res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
          res.end(req.method === "HEAD" ? void 0 : bytes);
        } catch {
          next();
        }
      });
    }
  },
  graphql: {
    extendGraphqlSchema: import_core5.g.extend((base) => ({
      mutation: {
        votePoll: import_core5.g.field({
          type: base.object("Poll"),
          args: {
            slug: import_core5.g.arg({ type: import_core5.g.nonNull(import_core5.g.String) }),
            option: import_core5.g.arg({ type: import_core5.g.nonNull(import_core5.g.String) })
          },
          async resolve(_source, { slug, option }, context) {
            const fields = { yes: "yes_count", no: "no_count", "no-comment": "no_comment_count" };
            const field = fields[option];
            if (!field) throw new Error("Choose yes, no, or no-comment.");
            const poll = await context.prisma.poll.update({
              where: { slug },
              data: { [field]: { increment: 1 } }
            });
            return context.db.Poll.findOne({ where: { id: String(poll.id) } });
          }
        })
      }
    }))
  }
});
//# sourceMappingURL=config.js.map
