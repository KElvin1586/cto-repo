// Functional tests for the entitlement (Free/Premium) system.
// Run with: bun /home/team/shared/site/scripts/test-entitlements.mjs
import {
  hasFeature,
  assertFeature,
  qrTypeFeature,
  FEATURES,
} from "/home/team/shared/site/src/app/entitlements/index.ts";
import { PLAN_CONFIG, formatPrice } from "/home/team/shared/site/src/app/entitlements/config.ts";

let pass = 0;
let fail = 0;
const check = (name, cond) => {
  if (cond) {
    pass++;
    console.log(`  ✓ ${name}`);
  } else {
    fail++;
    console.log(`  ✗ FAIL ${name}`);
  }
};

console.log("Entitlement tests\n");
console.log("FREE plan access:");
check("url is FREE", hasFeature("FREE", "qr-url"));
check("text is FREE", hasFeature("FREE", "qr-text"));
check("wifi locked for FREE", !hasFeature("FREE", "qr-wifi"));
check("vcard locked for FREE", !hasFeature("FREE", "qr-vcard"));
check("email locked for FREE", !hasFeature("FREE", "qr-email"));
check("phone locked for FREE", !hasFeature("FREE", "qr-phone"));
check("sms locked for FREE", !hasFeature("FREE", "qr-sms"));
check("whatsapp locked for FREE", !hasFeature("FREE", "qr-whatsapp"));
check("event locked for FREE", !hasFeature("FREE", "qr-event"));
check("location locked for FREE", !hasFeature("FREE", "qr-location"));
check("svg locked for FREE", !hasFeature("FREE", "export-svg"));
check("pdf locked for FREE", !hasFeature("FREE", "export-pdf"));
check("highres locked for FREE", !hasFeature("FREE", "export-highres"));
check("logo locked for FREE", !hasFeature("FREE", "logo"));
check("advanced style locked for FREE", !hasFeature("FREE", "style-advanced"));
check("history locked for FREE", !hasFeature("FREE", "history"));
check("templates locked for FREE", !hasFeature("FREE", "templates"));
check("batch locked for FREE", !hasFeature("FREE", "batch"));

console.log("\nPREMIUM plan access (everything unlocked):");
for (const id of Object.keys(FEATURES)) {
  check(`premium can use ${id}`, hasFeature("PREMIUM", id));
}

console.log("\nQR-type → feature mapping:");
check("url → qr-url", qrTypeFeature("url") === "qr-url");
check("wifi → qr-wifi", qrTypeFeature("wifi") === "qr-wifi");
check("vcard → qr-vcard", qrTypeFeature("vcard") === "qr-vcard");
check("text → qr-text", qrTypeFeature("text") === "qr-text");

console.log("\nEnforcement (assertFeature):");
let threw = 0;
try {
  assertFeature("FREE", "qr-wifi");
} catch {
  threw++;
}
check("assertFeature(FREE, wifi) throws", threw === 1);
let ok = 0;
try {
  assertFeature("PREMIUM", "qr-wifi");
  ok++;
} catch {
  /* not expected */
}
check("assertFeature(PREMIUM, wifi) does not throw", ok === 1);

console.log("\nConfig:");
check("default plan is FREE", PLAN_CONFIG.defaultPlan === "FREE");
check("premium price 9.99 USD", PLAN_CONFIG.plans.PREMIUM.price === 9.99 && PLAN_CONFIG.plans.PREMIUM.currency === "USD");
check("free price 0", PLAN_CONFIG.plans.FREE.price === 0);
check("formatPrice premium = $9.99", formatPrice(PLAN_CONFIG.plans.PREMIUM) === "$9.99");
check("formatPrice free = $0", formatPrice(PLAN_CONFIG.plans.FREE) === "$0");

console.log(`\n${pass} passed, ${fail} failed`);
if (fail > 0) process.exit(1);
console.log("ALL ENTITLEMENT TESTS PASS");
