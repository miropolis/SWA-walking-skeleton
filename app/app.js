import { serve } from "https://deno.land/std@0.171.0/http/server.ts";
import postgres from "https://deno.land/x/postgresjs@v3.3.3/mod.js";

const sql = postgres({});

/*const logNames = async () => {
  const result = await sql`SELECT * FROM todos`;
  console.log(result);
};

const handleRequest = (request) => {
  console.log(`Request to ${request.url}`);
  logNames();
  return new Response("Hello world! And aliens!");
};*/

const handleGetRoot = async (request) => {
  return new Response("Hello world at root!");
};

const handleGetItem = async (request, urlPatternResult) => {
  const id = urlPatternResult.pathname.groups.id;
  const items = await sql`SELECT * FROM todos WHERE id = ${id}`;

  // assuming that there's always an item that matches the id
  return Response.json(items[0]);
};

const handleGetItems = async (request) => {
  const items = await sql`SELECT * FROM todos`;
  return Response.json(items);
};

const handlePostItems = async (request) => {
  // assuming that the request has a json object and that
  // the json object has a property name
  try {
    const item = await request.json();
    await sql`INSERT INTO todos (item) VALUES (${item.name})`;
  } catch (error) {
    console.error(error);
    return new Response("NOT OK", { status: 400 });
  }

  return new Response("OK", { status: 200 });
};

const urlMapping = [
  {
    method: "GET",
    pattern: new URLPattern({ pathname: "/todos/:id" }),
    fn: handleGetItem,
  },
  {
    method: "GET",
    pattern: new URLPattern({ pathname: "/todos" }),
    fn: handleGetItems,
  },
  {
    method: "POST",
    pattern: new URLPattern({ pathname: "/todos" }),
    fn: handlePostItems,
  },
  {
    method: "GET",
    pattern: new URLPattern({ pathname: "/" }),
    fn: handleGetRoot,
  },
];

const handleRequest = async (request) => {
  const mapping = urlMapping.find(
    (um) => um.method === request.method && um.pattern.test(request.url),
  );

  if (!mapping) {
    return new Response("Not found", { status: 404 });
  }

  const mappingResult = mapping.pattern.exec(request.url);
  return await mapping.fn(request, mappingResult);
};

console.log("Launching server on port 7777");
serve(handleRequest, { port: 7777 });
