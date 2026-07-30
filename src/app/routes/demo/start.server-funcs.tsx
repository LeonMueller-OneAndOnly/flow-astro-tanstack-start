import { useState } from "react";
import { asc } from "drizzle-orm";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";

import { db } from "../../../db/client";
import { demoTodos } from "../../../db/schema";
import { BackLink } from "@/components/BackLink";
import { DemoExplainer } from "@/components/DemoExplainer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
  .validator((d: string) => d.trim())
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
    <main className="mx-auto w-full max-w-3xl px-6 pt-10 pb-24">
      <BackLink to="/demo" />
      <div className="mt-6 flex items-center gap-3">
        <h1 className="text-3xl font-semibold tracking-tight">Todo example</h1>
        {todos ? <Badge variant="secondary">{todos.length}</Badge> : null}
      </div>
      <DemoExplainer feature="TanStack Start server functions" className="mt-6">
        The route <code>loader</code> calls <code>getTodos</code> on the server to read the list.
        Adding one runs the <code>addTodo</code> POST server function — typed RPC that writes to the
        database — then <code>router.invalidate()</code> refetches the loader.
      </DemoExplainer>

      {todos && todos.length > 0 ? (
        <ul className="mt-8 shadow-soft divide-y divide-border rounded-xl border border-border bg-card">
          {todos.map((t) => (
            <li key={t.id} className="px-5 py-3.5">
              {t.name}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-8 rounded-xl border border-dashed border-border px-5 py-8 text-center text-sm text-muted-foreground">
          No todos yet — add the first one below.
        </p>
      )}

      <div className="mt-6 space-y-2">
        <Label htmlFor="new-todo">New todo</Label>
        <div className="flex gap-2">
          <Input
            id="new-todo"
            type="text"
            value={todo}
            onChange={(e) => setTodo(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                submitTodo();
              }
            }}
            placeholder="Enter a new todo..."
          />
          <Button disabled={todo.trim().length === 0} onClick={submitTodo}>
            Add
          </Button>
        </div>
      </div>
    </main>
  );
}
