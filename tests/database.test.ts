import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import { defaultContent } from "../src/lib/content/defaults";
const owner = "00000000-0000-4000-8000-000000000001";
const stranger = "00000000-0000-4000-8000-000000000002";
test("database enforces roles, publication isolation, revisions and media references", async (t) => {
  const db = new PGlite();
  await db.exec(`create role anon;create role authenticated;create schema auth;create schema storage;
 create table auth.users(id uuid primary key,email text,email_confirmed_at timestamptz);
 create table auth.identities(user_id uuid,provider text);
 create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
 create function auth.jwt() returns jsonb language sql stable as $$select coalesce(nullif(current_setting('request.jwt.claims',true),''),'{}')::jsonb$$;
 grant usage on schema auth,storage,public to anon,authenticated;
 create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
 create table storage.objects(id serial,bucket_id text,name text);
 alter table storage.objects enable row level security;
 grant select,insert,update,delete on storage.objects to anon,authenticated;
 grant usage on sequence storage.objects_id_seq to anon,authenticated;`);
  for (const migration of (await fs.readdir("supabase/migrations"))
    .filter((name) => name.endsWith(".sql"))
    .sort()) {
    await db.exec(
      await fs.readFile(`supabase/migrations/${migration}`, "utf8"),
    );
  }
  await db.exec(await fs.readFile("supabase/seed.sql", "utf8"));
  await db.query("insert into auth.users values ($1,$2,now()),($3,$4,now())", [
    owner,
    "chiputrakevin@gmail.com",
    stranger,
    "visitor@example.com",
  ]);
  await db.query("insert into auth.identities values ($1,'google')", [owner]);
  await db.exec(await fs.readFile("supabase/bootstrap-admin.sql", "utf8"));
  const asRole = async <T>(
    role: "anon" | "authenticated",
    uid: string,
    fn: (tx: Parameters<Parameters<typeof db.transaction>[0]>[0]) => Promise<T>,
  ) =>
    db.transaction(async (tx) => {
      await tx.exec(`set local role ${role}`);
      await tx.query(
        "select set_config('request.jwt.claim.sub',$1,true),set_config('request.jwt.claims',$2,true)",
        [uid, JSON.stringify({ app_metadata: { provider: "google" } })],
      );
      return fn(tx);
    });
  await t.test(
    "anonymous sees only published content; cannot read private files",
    async () => {
      const result = await asRole("anon", "", (tx) =>
        tx.query("select slot from public.portfolio_snapshots"),
      );
      assert.deepEqual(result.rows, [{ slot: "published" }]);
      await db.query(
        "insert into storage.objects(bucket_id,name) values ('portfolio-drafts','private.webp')",
      );
      assert.equal(
        (
          await asRole("anon", "", (tx) =>
            tx.query(
              "select * from storage.objects where bucket_id='portfolio-drafts'",
            ),
          )
        ).rows.length,
        0,
      );
    },
  );
  await t.test(
    "strangers cannot access draft or promote themselves",
    async () => {
      const result = await asRole("authenticated", stranger, (tx) =>
        tx.query("select slot from public.portfolio_snapshots"),
      );
      assert.deepEqual(result.rows, [{ slot: "published" }]);
      await assert.rejects(() =>
        asRole("authenticated", stranger, (tx) =>
          tx.query("insert into public.portfolio_admins(user_id) values ($1)", [
            stranger,
          ]),
        ),
      );
      await assert.rejects(() =>
        asRole("authenticated", stranger, (tx) =>
          tx.query("select public.portfolio_save_draft(1,$1)", [
            JSON.stringify(defaultContent),
          ]),
        ),
      );
      await assert.rejects(() =>
        asRole("authenticated", stranger, (tx) =>
          tx.query("select public.portfolio_publish(1)"),
        ),
      );
    },
  );
  await t.test(
    "even owner cannot bypass write RPCs or overwrite immutable files",
    async () => {
      await assert.rejects(() =>
        asRole("authenticated", owner, (tx) =>
          tx.query("update public.portfolio_snapshots set revision=99"),
        ),
      );
      await asRole("authenticated", owner, async (tx) => {
        const result = await tx.query(
          "update storage.objects set name='changed' returning *",
        );
        assert.equal(result.rows.length, 0);
      });
    },
  );
  const draft = structuredClone(defaultContent);
  draft.profile.name = "Changed draft";
  await t.test(
    "saving changes only draft; stale revision is rejected",
    async () => {
      await asRole("authenticated", owner, (tx) =>
        tx.query("select public.portfolio_save_draft(1,$1)", [
          JSON.stringify(draft),
        ]),
      );
      const result = await asRole("anon", "", (tx) =>
        tx.query<{ name: string }>(
          "select document#>>'{profile,name}' as name from public.portfolio_snapshots",
        ),
      );
      assert.equal(result.rows[0].name, defaultContent.profile.name);
      await assert.rejects(
        () =>
          asRole("authenticated", owner, (tx) =>
            tx.query("select public.portfolio_save_draft(1,$1)", [
              JSON.stringify(defaultContent),
            ]),
          ),
        { code: "PT409" },
      );
    },
  );
  await t.test(
    "seed is idempotent and publish atomically copies saved content",
    async () => {
      await db.exec(await fs.readFile("supabase/seed.sql", "utf8"));
      await asRole("authenticated", owner, (tx) =>
        tx.query("select public.portfolio_publish(2)"),
      );
      const result = await asRole("anon", "", (tx) =>
        tx.query<{ name: string }>(
          "select document#>>'{profile,name}' as name from public.portfolio_snapshots",
        ),
      );
      assert.equal(result.rows[0].name, "Changed draft");
    },
  );
  const assetId = "11111111-1111-4111-8111-111111111111";
  const path = `${assetId}.webp`;
  await t.test(
    "a new media draft cannot publish until all public assets exist",
    async () => {
      await db.query(
        "insert into storage.objects(bucket_id,name) values ('portfolio-drafts',$1)",
        [path],
      );
      await asRole("authenticated", owner, (tx) =>
        tx.query("select public.portfolio_register_media($1,800,600)", [
          assetId,
        ]),
      );
      draft.media.push({
        id: assetId,
        path,
        alt: "New photo",
        width: 800,
        height: 600,
      });
      draft.profile.photo = assetId;
      await asRole("authenticated", owner, (tx) =>
        tx.query("select public.portfolio_save_draft(2,$1)", [
          JSON.stringify(draft),
        ]),
      );
      await assert.rejects(() =>
        asRole("authenticated", owner, (tx) =>
          tx.query("select public.portfolio_publish(3)"),
        ),
      );
      const result = await db.query<{ photo: string }>(
        "select document#>>'{profile,photo}' as photo from public.portfolio_snapshots where slot='published'",
      );
      assert.equal(result.rows[0].photo, "portrait");
      await asRole("authenticated", owner, (tx) =>
        tx.query(
          "insert into storage.objects(bucket_id,name) values ('portfolio-public',$1)",
          [path],
        ),
      );
      await asRole("authenticated", owner, (tx) =>
        tx.query("select public.portfolio_publish(3)"),
      );
    },
  );
  await t.test(
    "published images remain protected even when removed from draft",
    async () => {
      await asRole("authenticated", owner, (tx) =>
        tx.query("select public.portfolio_save_draft(3,$1)", [
          JSON.stringify(defaultContent),
        ]),
      );
      await assert.rejects(() =>
        asRole("authenticated", owner, (tx) =>
          tx.query("select public.portfolio_mark_media_deleted($1)", [assetId]),
        ),
      );
      const deletion = await asRole("authenticated", owner, (tx) =>
        tx.query("delete from storage.objects where name=$1 returning *", [
          path,
        ]),
      );
      assert.equal(deletion.rows.length, 0);
      await asRole("authenticated", owner, (tx) =>
        tx.query("select public.portfolio_publish(4)"),
      );
      await asRole("authenticated", owner, (tx) =>
        tx.query("select public.portfolio_mark_media_deleted($1)", [assetId]),
      );
      await assert.rejects(() =>
        asRole("authenticated", owner, (tx) =>
          tx.query("select public.portfolio_save_draft(4,$1)", [
            JSON.stringify(draft),
          ]),
        ),
      );
      const removed = await asRole("authenticated", owner, (tx) =>
        tx.query("delete from storage.objects where name=$1 returning *", [
          path,
        ]),
      );
      assert.equal(removed.rows.length, 2);
    },
  );
  await db.close();
});
