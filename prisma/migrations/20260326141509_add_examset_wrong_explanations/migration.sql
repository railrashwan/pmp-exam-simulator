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
    "wrongExplanationEn" TEXT,
    "wrongExplanationAr" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Question" ("correctAnswer", "createdAt", "domain", "explanationAr", "explanationEn", "id", "optionAAr", "optionAEn", "optionBAr", "optionBEn", "optionCAr", "optionCEn", "optionDAr", "optionDEn", "questionTextAr", "questionTextEn", "updatedAt") SELECT "correctAnswer", "createdAt", "domain", "explanationAr", "explanationEn", "id", "optionAAr", "optionAEn", "optionBAr", "optionBEn", "optionCAr", "optionCEn", "optionDAr", "optionDEn", "questionTextAr", "questionTextEn", "updatedAt" FROM "Question";
DROP TABLE "Question";
ALTER TABLE "new_Question" RENAME TO "Question";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
