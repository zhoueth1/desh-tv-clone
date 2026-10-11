-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE IF NOT EXISTS "User" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL DEFAULT '',
    "email" TEXT NOT NULL DEFAULT '',
    "password" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "Article" (
    "id" SERIAL NOT NULL,
    "slug" VARCHAR(380) NOT NULL DEFAULT '',
    "image_id" TEXT,
    "image_extension" TEXT,
    "image_filesize" INTEGER,
    "image_width" INTEGER,
    "image_height" INTEGER,
    "image_data" TEXT,
    "title" TEXT NOT NULL DEFAULT '',
    "translated_date" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "content" JSONB NOT NULL DEFAULT '[{"type":"paragraph","children":[{"text":""}]}]',
    "category" INTEGER,

    CONSTRAINT "Article_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "Category" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL DEFAULT '',
    "slug" TEXT NOT NULL DEFAULT '',

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "Poll" (
    "id" SERIAL NOT NULL,
    "slug" VARCHAR(380) NOT NULL DEFAULT '',
    "image_id" TEXT,
    "image_extension" TEXT,
    "image_filesize" INTEGER,
    "image_width" INTEGER,
    "image_height" INTEGER,
    "image_data" TEXT,
    "title" TEXT NOT NULL DEFAULT '',
    "translated_date" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "yes_count" INTEGER NOT NULL DEFAULT 0,
    "no_count" INTEGER NOT NULL DEFAULT 0,
    "no_comment_count" INTEGER NOT NULL DEFAULT 0,
    "desh_yes_count" INTEGER DEFAULT 0,
    "desh_no_count" INTEGER DEFAULT 0,
    "desh_no_comment_count" INTEGER DEFAULT 0,

    CONSTRAINT "Poll_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "_Article_recommendedArticles" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_Article_recommendedArticles_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "Article_slug_key" ON "Article"("slug");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "Article_title_key" ON "Article"("title");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Article_category_idx" ON "Article"("category");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "Poll_slug_key" ON "Poll"("slug");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "Poll_title_key" ON "Poll"("title");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "_Article_recommendedArticles_B_index" ON "_Article_recommendedArticles"("B");

-- All access goes through the server's Keystone GraphQL API.
-- Supabase's public Data API roles must not read or write these tables directly.
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Article" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Category" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Poll" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "_Article_recommendedArticles" ENABLE ROW LEVEL SECURITY;
