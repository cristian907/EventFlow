-- CreateTable
CREATE TABLE "EventBotConfig" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "telegramBotTokenEncrypted" TEXT,
    "salesWhatsappNumber" TEXT,
    "salesHandoffMessage" TEXT,
    "welcomeMessage" TEXT,
    "isEnabled" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EventBotConfig_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EventBotConfig_eventId_key" ON "EventBotConfig"("eventId");

-- AddForeignKey
ALTER TABLE "EventBotConfig" ADD CONSTRAINT "EventBotConfig_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
