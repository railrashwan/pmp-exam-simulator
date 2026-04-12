/*
  Warnings:

  - You are about to drop the column `wrongExplanationAr` on the `Question` table. All the data in the column will be lost.
  - You are about to drop the column `wrongExplanationEn` on the `Question` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Question" (
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
    "examSet" TEXT NOT NULL DEFAULT 'pmp',
    "globalBank" BOOLEAN NOT NULL DEFAULT false,
    "explanationAEn" TEXT,
    "explanationAAr" TEXT,
    "explanationBEn" TEXT,
    "explanationBAr" TEXT,
    "explanationCEn" TEXT,
    "explanationCAr" TEXT,
    "explanationDEn" TEXT,
    "explanationDAr" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Question" ("correctAnswer", "createdAt", "domain", "examSet", "explanationAr", "explanationEn", "globalBank", "id", "optionAAr", "optionAEn", "optionBAr", "optionBEn", "optionCAr", "optionCEn", "optionDAr", "optionDEn", "questionTextAr", "questionTextEn", "updatedAt") SELECT "correctAnswer", "createdAt", "domain", "examSet", "explanationAr", "explanationEn", "globalBank", "id", "optionAAr", "optionAEn", "optionBAr", "optionBEn", "optionCAr", "optionCEn", "optionDAr", "optionDEn", "questionTextAr", "questionTextEn", "updatedAt" FROM "Question";
DROP TABLE "Question";
ALTER TABLE "new_Question" RENAME TO "Question";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
