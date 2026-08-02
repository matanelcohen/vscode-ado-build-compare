import assert from "node:assert/strict";
import test from "node:test";
import { PromiseLruCache } from "../src/utils/promiseLruCache";

test("reuses in-flight and completed requests", async () => {
  const cache = new PromiseLruCache<string, number>(2);
  let calls = 0;
  const factory = async () => ++calls;
  assert.equal(await cache.getOrCreate("a", factory), 1);
  assert.equal(await cache.getOrCreate("a", factory), 1);
  assert.equal(calls, 1);
});

test("evicts least-recently-used and failed requests", async () => {
  const cache = new PromiseLruCache<string, number>(2);
  let calls = 0;
  const factory = async () => ++calls;
  await cache.getOrCreate("a", factory);
  await cache.getOrCreate("b", factory);
  await cache.getOrCreate("a", factory);
  await cache.getOrCreate("c", factory);
  assert.equal(await cache.getOrCreate("b", factory), 4);

  await assert.rejects(
    cache.getOrCreate("failure", async () => {
      throw new Error("failed");
    })
  );
  assert.equal(await cache.getOrCreate("failure", factory), 5);
});
