import { useState } from "react";
import { asc } from "drizzle-orm";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";

import { db } from "../../../db/client";
import { demoTodos } from "../../../db/schema";
import { brandPageBackground, brandPrimaryButtonClass } from "../../lib/brand-theme";

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
      className="flex min-h-screen items-center justify-center bg-background p-4 text-foreground"
      style={brandPageBackground}
    >
      <div className="w-full max-w-2xl rounded-2xl border border-foreground/10 bg-card/80 p-8 shadow-xl backdrop-blur-sm">
        <p className="mb-3 text-sm font-extrabold uppercase tracking-[0.18em] text-brand-secondary-700">
          Server functions
        </p>
        <h1 className="mb-5 text-2xl font-bold tracking-tight text-foreground">Todo example</h1>
        <ul className="mb-4 space-y-2">
          {todos?.map((t) => (
            <li
              key={t.id}
              className="rounded-lg border border-foreground/10 bg-foreground/5 p-3 shadow-sm"
            >
              <span className="text-lg text-foreground">{t.name}</span>
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
            className="w-full rounded-lg border border-border bg-card px-4 py-3 text-foreground placeholder:text-muted-foreground focus:border-transparent focus:outline-none focus:ring-2 focus:ring-brand-primary-500"
          />
          <button
            disabled={todo.trim().length === 0}
            onClick={submitTodo}
            className={`rounded-lg px-4 py-3 ${brandPrimaryButtonClass}`}
          >
            Add todo
          </button>
        </div>
      </div>
    </div>
  );
}
