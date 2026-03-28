import { QuestionForm } from "../../components/QuestionForm";

export default function NewQuestionPage() {
  return (
    <div>
      <div className="px-6 py-4 border-b bg-white">
        <h1 className="text-xl font-bold text-gray-800">Add New Question</h1>
      </div>
      <QuestionForm />
    </div>
  );
}
