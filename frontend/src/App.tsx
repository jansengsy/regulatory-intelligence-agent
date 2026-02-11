import { Dashboard } from "@/components/Dashboard";

export default function App() {
  return (
    <div className="h-screen flex flex-col overflow-hidden bg-white">
      <main className="max-w-[90%] mx-auto px-4 py-6 flex-1 min-h-0 w-full">
        <Dashboard />
      </main>
    </div>
  );
}
