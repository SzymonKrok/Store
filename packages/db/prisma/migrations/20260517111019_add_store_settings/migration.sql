-- CreateTable
CREATE TABLE "StoreSettings" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "ga4Id" TEXT,
    "fbPixelId" TEXT,
    "termsOfService" TEXT NOT NULL DEFAULT '',
    "privacyPolicy" TEXT NOT NULL DEFAULT '',

    CONSTRAINT "StoreSettings_pkey" PRIMARY KEY ("id")
);
