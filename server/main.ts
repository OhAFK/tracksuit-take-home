import { Database } from "@db/sqlite";
import * as oak from "@oak/oak";
import * as path from "@std/path";
import { z } from "zod";
import { Port } from "../lib/utils/index.ts";
import listInsights from "./operations/list-insights.ts";
import lookupInsight from "./operations/lookup-insight.ts";
import { createTable as createInsightsTable } from "./tables/insights.ts";

console.log("Loading configuration");

const env = {
  port: Port.parse(Deno.env.get("SERVER_PORT")),
};

const dbFilePath = path.resolve("tmp", "db.sqlite3");

console.log(`Opening SQLite database at ${dbFilePath}`);

await Deno.mkdir(path.dirname(dbFilePath), { recursive: true });
const db = new Database(dbFilePath);
db.exec(createInsightsTable);

console.log("Initialising server");

const CreateInsight = z.object({
  brandId: z.number().int().min(0),
  text: z.string().trim().min(1),
});
const InsightId = z.coerce.number().int().min(0);

const router = new oak.Router();

router.get("/_health", (ctx) => {
  ctx.response.body = "OK";
  ctx.response.status = 200;
});

router.get("/insights", (ctx) => {
  const result = listInsights({ db });
  ctx.response.body = result.map(({ id, brand, createdAt, text }) => ({
    id,
    brandId: brand,
    date: createdAt,
    text,
  }));
  ctx.response.status = 200;
});

router.get("/insights/:id", (ctx: oak.RouterContext<"/insights/:id">) => {
  const parsedId = InsightId.safeParse(ctx.params.id);
  if (!parsedId.success) {
    ctx.response.status = 400;
    ctx.response.body = { error: "Insight ID must be a non-negative integer" };
    return;
  }

  const result = lookupInsight({ db, id: parsedId.data });
  ctx.response.body = result;
  ctx.response.status = 200;
});

router.post("/insights", async (ctx) => {
  let body: unknown;
  try {
    body = await ctx.request.body.json();
  } catch (error) {
    if (!(error instanceof SyntaxError)) throw error;
    ctx.response.status = 400;
    ctx.response.body = { error: "Request body must be valid JSON" };
    return;
  }

  const parsedBody = CreateInsight.safeParse(body);
  if (!parsedBody.success) {
    ctx.response.status = 400;
    ctx.response.body = {
      error: "Invalid insight",
      details: parsedBody.error.issues,
    };
    return;
  }

  const { brandId, text } = parsedBody.data;
  const createdAt = new Date().toISOString();
  const statement = db.prepare(
    "INSERT INTO insights (brand, createdAt, text) VALUES (?, ?, ?) RETURNING *",
  );
  let created: {
    id: number;
    brand: number;
    createdAt: string;
    text: string;
  } | undefined;
  try {
    [created] = statement.all(brandId, createdAt, text);
  } finally {
    statement.finalize();
  }

  if (!created) {
    throw new Error("Insight insert did not return the created record");
  }

  ctx.response.status = 201;
  ctx.response.body = {
    id: created.id,
    brandId: created.brand,
    date: created.createdAt,
    text: created.text,
  };
});

router.delete("/insights", (ctx) => {
  const rawId = ctx.request.url.searchParams.get("id");
  const id = rawId === null || rawId.trim() === "" ? NaN : Number(rawId);
  if (!Number.isSafeInteger(id) || id < 0) {
    ctx.response.status = 400;
    ctx.response.body = {
      error: "A non-negative integer insight ID is required",
    };
    return;
  }

  const statement = db.prepare(
    "DELETE FROM insights WHERE id = ? RETURNING id",
  );
  let deleted: { id: number }[];
  try {
    deleted = statement.all<{ id: number }>(id);
  } finally {
    statement.finalize();
  }

  if (deleted.length === 0) {
    ctx.response.status = 404;
    ctx.response.body = { error: "Insight not found" };
    return;
  }

  ctx.response.status = 204;
});

const app = new oak.Application();

app.use(router.routes());
app.use(router.allowedMethods());

app.listen(env);
console.log(`Started server on port ${env.port}`);
