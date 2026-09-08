import { describe, it, expect } from "vitest";
import { NextRequest } from "next/server";
import { db } from "../../src/db/client";
import { users, taxPeriods } from "../../src/db/schema";
import { hashPassword } from "../../src/lib/auth/password";
import {
  createSession,
  SESSION_COOKIE_NAME,
} from "../../src/lib/auth/session";
import {
  createDossier,
  listDossiersForClient,
  countDossiersByService,
} from "../../src/lib/dossiers";
import { POST as createDossierRoute } from "../../src/app/api/dossiers/route";
import { SERVICE_TYPES, CLIENT_CREATABLE } from "../../src/lib/serviceTypes";

async function makeUser(role: "client" | "admin" = "client") {
  const email = `svc-${Date.now()}-${Math.random()}@example.test`;
  const [user] = await db
    .insert(users)
    .values({
      email,
      passwordHash: await hashPassword("irrelevant-here"),
      firstName: "A",
      lastName: "B",
      role,
    })
    .returning();
  return user;
}

async function openPeriod(year: number) {
  await db
    .insert(taxPeriods)
    .values({ year, isActive: true })
    .onConflictDoNothing();
}

function postReq(body: unknown, token?: string) {
  const request = new NextRequest("http://localhost/api/dossiers", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
  });
  if (token) request.cookies.set(SESSION_COOKIE_NAME, token);
  return request;
}

describe("service types on dossiers", () => {
  it("defaults to a declaration, preserving pre-existing callers", async () => {
    const client = await makeUser();
    const dossier = await createDossier({ clientId: client.id, taxYear: 2041 });
    expect(dossier.serviceType).toBe("declaration");
  });

  it("lets one client hold a different prestation for the same year", async () => {
    const client = await makeUser();

    const declaration = await createDossier({
      clientId: client.id,
      taxYear: 2042,
    });
    const capital = await createDossier({
      clientId: client.id,
      taxYear: 2042,
      serviceType: "capital",
    });

    expect(capital.id).not.toBe(declaration.id);
    expect(await listDossiersForClient(client.id)).toHaveLength(2);
  });

  it("still collapses a repeat of the same prestation and year", async () => {
    const client = await makeUser();

    const first = await createDossier({
      clientId: client.id,
      taxYear: 2043,
      serviceType: "simulation",
    });
    const second = await createDossier({
      clientId: client.id,
      taxYear: 2043,
      serviceType: "simulation",
    });

    expect(second.id).toBe(first.id);
    expect(await listDossiersForClient(client.id, "simulation")).toHaveLength(1);
  });

  it("filters a client's list by prestation", async () => {
    const client = await makeUser();
    await createDossier({ clientId: client.id, taxYear: 2044 });
    await createDossier({
      clientId: client.id,
      taxYear: 2044,
      serviceType: "relecture",
    });

    const onlyRelecture = await listDossiersForClient(client.id, "relecture");
    expect(onlyRelecture).toHaveLength(1);
    expect(onlyRelecture[0].serviceType).toBe("relecture");
  });

  it("counts per prestation for the admin hub", async () => {
    // `countDossiersByService` counts every client, and the test database is
    // never reset — so a run cannot claim a year to itself, however wide the
    // random range. Assert what this run added instead of an absolute total.
    const year = 2200 + Math.floor(Math.random() * 800);
    const before = await countDossiersByService(year);

    const client = await makeUser();
    await createDossier({
      clientId: client.id,
      taxYear: year,
      serviceType: "acompte",
    });

    const after = await countDossiersByService(year);
    expect((after.acompte ?? 0) - (before.acompte ?? 0)).toBe(1);
    expect(after.capital ?? 0).toBe(before.capital ?? 0);
  });
});

describe("POST /api/dossiers — who may open what", () => {
  it("lets a client open their own prestation request", async () => {
    const client = await makeUser();
    const { token } = await createSession(client.id, {});
    await openPeriod(2046);

    const res = await createDossierRoute(
      postReq({ taxYear: 2046, serviceType: "capital" }, token),
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.dossier.serviceType).toBe("capital");
    expect(body.dossier.clientId).toBe(client.id);
  });

  it("refuses to let a client open a declaration for themselves", async () => {
    const client = await makeUser();
    const { token } = await createSession(client.id, {});
    await openPeriod(2047);

    const res = await createDossierRoute(
      postReq({ taxYear: 2047, serviceType: "declaration" }, token),
    );

    expect(res.status).toBe(403);
  });

  it("refuses to let a client open a request for somebody else", async () => {
    const client = await makeUser();
    const victim = await makeUser();
    const { token } = await createSession(client.id, {});
    await openPeriod(2048);

    const res = await createDossierRoute(
      postReq(
        { clientId: victim.id, taxYear: 2048, serviceType: "capital" },
        token,
      ),
    );

    expect(res.status).toBe(403);
    expect(await listDossiersForClient(victim.id)).toHaveLength(0);
  });

  it("refuses a client request against a period that is not open", async () => {
    const client = await makeUser();
    const { token } = await createSession(client.id, {});
    // 2049 is deliberately never opened.

    const res = await createDossierRoute(
      postReq({ taxYear: 2049, serviceType: "capital" }, token),
    );

    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe("inactive_period");
  });

  it("lets an admin open any prestation, for a closed period too", async () => {
    const admin = await makeUser("admin");
    const client = await makeUser();
    const { token } = await createSession(admin.id, {});

    const res = await createDossierRoute(
      postReq(
        { clientId: client.id, taxYear: 2050, serviceType: "deces" },
        token,
      ),
    );

    expect(res.status).toBe(200);
    expect((await res.json()).dossier.serviceType).toBe("deces");
  });

  it("rejects a service type that is not in the vocabulary", async () => {
    const client = await makeUser();
    const { token } = await createSession(client.id, {});
    await openPeriod(2051);

    const res = await createDossierRoute(
      postReq({ taxYear: 2051, serviceType: "not-a-service" }, token),
    );

    expect(res.status).toBe(400);
  });
});

describe("service type vocabulary", () => {
  it("keeps declarations out of what a client may open", () => {
    expect(CLIENT_CREATABLE).not.toContain("declaration");
    expect(CLIENT_CREATABLE).toHaveLength(SERVICE_TYPES.length - 1);
  });
});
