import { useState } from "react";
import { asc } from "drizzle-orm";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";

import { db } from "../../db/client";
import { demoTodos } from "../../db/schema";

/*
const loggingMiddleware = createMiddleware().server(
  async ({ next, request }) => {
    console.log("Request:", request.url);
    return next();
  }
);
const loggedServerFunction = createServerFn({ method: "GET" }).middleware([
  loggingMiddleware,
]);
*/

type Todo = {
  id: number;
  name: string;
};

async function readTodos(): Promise<Array<Todo>> {
  const todos = await listTodos();

  if (todos.length > 0) {
    return todos;
  }

  await db.insert(demoTodos).values([
    { name: "Get groceries", createdAt: new Date() },
    { name: "Buy a new phone", createdAt: new Date() },
  ]);

  return await listTodos();
}

async function listTodos(): Promise<Array<Todo>> {
  return await db
    .select({ id: demoTodos.id, name: demoTodos.name })
    .from(demoTodos)
    .orderBy(asc(demoTodos.id));
}

const getTodos = createServerFn({
  method: "GET",
}).handler(async () => await readTodos());

const addTodo = createServerFn({ method: "POST" })
  .inputValidator((d: string) => d.trim())
  .handler(async ({ data }) => {
    if (data.length === 0) {
      return await readTodos();
    }

    await readTodos();
    await db.insert(demoTodos).values({ name: data, createdAt: new Date() });

    return await listTodos();
  });

/** Served at `/app/demo/start/server-funcs`; TanStack route paths are mounted under Astro's `/app` catch-all. */
export const Route = createFileRoute("/demo/start/server-funcs")({
  component: Home,
  loader: async () => await getTodos(),
});

function Home() {
  const router = useRouter();
  let todos = Route.useLoaderData();

  const [todo, setTodo] = useState("");

  const submitTodo = async () => {
    todos = await addTodo({ data: todo });
    setTodo("");
    router.invalidate();
  };

  return (
    <div
      className="flex items-center justify-center min-h-screen bg-gradient-to-br from-zinc-800 to-black p-4 text-white"
      style={{
        backgroundImage:
          "radial-gradient(50% 50% at 20% 60%, #23272a 0%, #18181b 50%, #000000 100%)",
      }}
    >
      <div className="w-full max-w-2xl p-8 rounded-xl backdrop-blur-md bg-black/50 shadow-xl border-8 border-black/10">
        <h1 className="text-2xl mb-4">Start Server Functions - Todo Example</h1>
        <ul className="mb-4 space-y-2">
          {todos?.map((t) => (
            <li
              key={t.id}
              className="bg-white/10 border border-white/20 rounded-lg p-3 backdrop-blur-sm shadow-md"
            >
              <span className="text-lg text-white">{t.name}</span>
            </li>
          ))}
        </ul>
        <div className="flex flex-col gap-2">
          <input
            aria-label="New todo"
            type="text"
            value={todo}
            onChange={(e) => setTodo(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                submitTodo();
              }
            }}
            placeholder="Enter a new todo..."
            className="w-full px-4 py-3 rounded-lg border border-white/20 bg-white/10 backdrop-blur-sm text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
          />
          <button
            disabled={todo.trim().length === 0}
            onClick={submitTodo}
            className="bg-blue-500 hover:bg-blue-600 disabled:bg-blue-500/50 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition-colors"
          >
            Add todo
          </button>
        </div>
      </div>
    </div>
  );
}
