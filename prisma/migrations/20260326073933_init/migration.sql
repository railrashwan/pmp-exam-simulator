-- CreateTable
CREATE TABLE "Question" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "domain" TEXT NOT NULL,
    "questionTextEn" TEXT NOT NULL,
    "questionTextAr" TEXT NOT NULL,
    "optionAEn" TEXT NOT NULL,
    "optionAAr" TEXT NOT NULL,
    "optionBEn" TEXT NOT NULL,
    "optionBAr" TEXT NOT NULL,
    "optionCEn" TEXT NOT NULL,
    "optionCAr" TEXT NOT NULL,
    "optionDEn" TEXT NOT NULL,
    "optionDAr" TEXT NOT NULL,
    "correctAnswer" TEXT NOT NULL,
    "explanationEn" TEXT NOT NULL,
    "explanationAr" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
