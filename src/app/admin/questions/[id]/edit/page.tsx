import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { QuestionForm } from "../../../components/QuestionForm";

export default async function EditQuestionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const question = await prisma.question.findUnique({
    where: { id: parseInt(id, 10) },
  });

  if (!question) notFound();

  const initial = {
    ...question,
    createdAt: question.createdAt.toISOString(),
    updatedAt: question.updatedAt.toISOString(),
  };

  return (
    <div>
      <div className="px-6 py-4 border-b bg-white">
        <h1 className="text-xl font-bold text-gray-800">Edit Question #{id}</h1>
      </div>
      <QuestionForm initial={initial} questionId={parseInt(id, 10)} />
    </div>
  );
}
