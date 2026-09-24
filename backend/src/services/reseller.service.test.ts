import assert from "node:assert/strict";
import { resellerService } from "./reseller.service.js";
import { resellerRepository } from "../repositories/reseller.repository.js";
import { userRepository } from "../repositories/user.repository.js";
import { auditService } from "./audit.service.js";
import type { Reseller, User } from "../types/index.js";

// Exercise the full decision workflow without writing to the application's data store.
const users = new Map<string, User>();
const resellers = new Map<string, Reseller>();
const replace = (
  target: object,
  method: string,
  implementation: (...args: any[]) => any,
) => {
  (target as Record<string, any>)[method] = implementation;
};

replace(
  userRepository,
  "findByEmail",
  async (email: string) =>
    [...users.values()].find((user) => user.email === email) || null,
);
replace(
  userRepository,
  "findByUsername",
  async (username: string) =>
    [...users.values()].find((user) => user.username === username) || null,
);
replace(
  userRepository,
  "findById",
  async (id: string) => users.get(id) || null,
);
replace(userRepository, "create", async (user: User) => {
  users.set(user.id, user);
  return user;
});
replace(
  userRepository,
  "update",
  async (id: string, changes: Partial<User>) => {
    const current = users.get(id);
    if (!current) return null;
    const updated = { ...current, ...changes };
    users.set(id, updated);
    return updated;
  },
);
replace(
  resellerRepository,
  "findByUsername",
  async (username: string) =>
    [...resellers.values()].find(
      (reseller) => reseller.username === username,
    ) || null,
);
replace(
  resellerRepository,
  "findByCode",
  async (code: string) =>
    [...resellers.values()].find(
      (reseller) => reseller.resellerCode === code,
    ) || null,
);
replace(
  resellerRepository,
  "findBySubdomain",
  async (subdomain: string) =>
    [...resellers.values()].find(
      (reseller) => reseller.subdomain === subdomain,
    ) || null,
);
replace(
  resellerRepository,
  "findById",
  async (id: string) => resellers.get(id) || null,
);
replace(resellerRepository, "create", async (reseller: Reseller) => {
  resellers.set(reseller.id, reseller);
  return reseller;
});
replace(
  resellerRepository,
  "update",
  async (id: string, changes: Partial<Reseller>) => {
    const current = resellers.get(id);
    if (!current) return null;
    const updated = { ...current, ...changes };
    resellers.set(id, updated);
    return updated;
  },
);
replace(
  resellerRepository,
  "findByStatus",
  async (status: Reseller["status"]) =>
    [...resellers.values()].filter((reseller) => reseller.status === status),
);
replace(auditService, "log", async () => null);

function application(username: string, email: string) {
  return {
    username,
    email,
    password: "secure-password-123",
    phone: "+971500000000",
    businessName: "Example Hardware LLC",
    displayName: "Example Hardware",
    address: {
      fullName: "Example Hardware",
      phone: "+971500000000",
      addressLine1: "Building 1, Business District",
      city: "Dubai",
      state: "Dubai",
      country: "United Arab Emirates",
      postalCode: "00000",
    },
    businessInformation: {
      tradeLicense: "TL-123456",
      taxNumber: "100123456789012",
      licenseJurisdiction: "Dubai Economy and Tourism",
      licenseExpiryDate: "2099-12-31",
      businessType: "Authorized Distributor",
      authorizedSignatory: "Example Owner",
      signatoryTitle: "Managing Director",
      description:
        "We supply enterprise servers and networking hardware across the region.",
      specializations: ["Enterprise Servers & Racks"],
      dispatchHub: "Dubai South Logistics City",
      settlementTerms: "Weekly settlement",
    },
  };
}

async function main() {
  const incomplete = application("incomplete", "incomplete@example.test");
  incomplete.businessInformation.licenseJurisdiction = "";
  await assert.rejects(
    () => resellerService.applyAsReseller(incomplete),
    /License jurisdiction/,
  );
  assert.equal(users.size, 0);
  assert.equal(resellers.size, 0);

  const first = await resellerService.applyAsReseller(
    application("example_one", "one@example.test"),
  );
  assert.equal(first.reseller.status, "PENDING_APPROVAL");
  assert.equal(first.user.isActive, false);
  assert.equal((await resellerService.getPendingApplications()).length, 1);
  await assert.rejects(() =>
    resellerService.updateResellerStatus(first.reseller.id, "ACTIVE", "admin"),
  );
  await assert.rejects(() =>
    resellerService.approveApplication(
      first.reseller.id,
      { resellerCode: "pending123" },
      "admin",
    ),
  );

  const approved = await resellerService.approveApplication(
    first.reseller.id,
    {
      resellerCode: "example101",
      commissionRate: 8,
    },
    "admin",
  );
  assert.equal(approved.status, "ACTIVE");
  assert.equal(approved.resellerCode, "example101");
  assert.equal(users.get(first.user.id)?.isActive, true);

  const second = await resellerService.applyAsReseller(
    application("example_two", "two@example.test"),
  );
  await assert.rejects(() =>
    resellerService.approveApplication(
      second.reseller.id,
      { resellerCode: "example101" },
      "admin",
    ),
  );
  const denied = await resellerService.denyApplication(
    second.reseller.id,
    "Incomplete business verification",
    "admin",
  );
  assert.equal(denied.status, "INACTIVE");
  assert.equal(users.get(second.user.id)?.isActive, false);
  await assert.rejects(() =>
    resellerService.updateResellerStatus(second.reseller.id, "ACTIVE", "admin"),
  );
  assert.equal((await resellerService.getPendingApplications()).length, 0);
  console.log("Reseller workflow test passed");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
