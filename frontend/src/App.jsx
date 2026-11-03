import { useEffect, useState } from "react";
import { api } from "./services/api";

export default function App() {
  const [state, setState] = useState({ status: "loading", data: null, error: null });

  useEffect(() => {
    const controller = new AbortController();
    api
      .health(controller.signal)
      .then((data) => setState({ status: "success", data, error: null }))
      .catch((error) => {
        if (error.name === "AbortError") return;
        setState({ status: "error", data: null, error });
      });
    return () => controller.abort();
  }, []);

  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow">
        <h1 className="text-2xl font-semibold text-slate-900">NyayAI</h1>
        <p className="mt-1 text-sm text-slate-500">
          AI-powered legal assistance platform
        </p>

        <div className="mt-6 text-sm">
          {state.status === "loading" && (
            <p className="text-slate-600">Checking backend…</p>
          )}
          {state.status === "error" && (
            <p className="text-red-600">Backend unreachable: {state.error.message}</p>
          )}
          {state.status === "success" && (
            <p className="text-green-700">
              Backend {state.data.status} · v{state.data.version} ·{" "}
              {state.data.environment}
            </p>
          )}
        </div>
      </div>
    </main>
  );
}