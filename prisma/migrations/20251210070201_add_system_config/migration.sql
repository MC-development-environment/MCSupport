-- CreateTable
CREATE TABLE "SystemConfig" (
    "id" TEXT NOT NULL,
    "companyName" TEXT NOT NULL DEFAULT 'Multicomputos',
    "supportEmail" TEXT NOT NULL DEFAULT 'support@multicomputos.com',
    "maintenanceMode" BOOLEAN NOT NULL DEFAULT false,
    "maxUploadSizeMB" INTEGER NOT NULL DEFAULT 5,
    "allowedFileTypes" TEXT NOT NULL DEFAULT '.jpg,.png,.pdf,.doc,.docx',
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedBy" TEXT,

    CONSTRAINT "SystemConfig_pkey" PRIMARY KEY ("id")
);
