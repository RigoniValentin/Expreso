const http = require("http");
const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");

function login() {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({ email: "admin@nehilak.com", password: "Admin123!" });
    const req = http.request(
      {
        host: "localhost", port: 3017, path: "/api/v1/auth/login", method: "POST",
        headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(data) },
      },
      (res) => {
        let body = "";
        res.on("data", (c) => (body += c));
        res.on("end", () => resolve({ status: res.statusCode, body }));
      }
    );
    req.on("error", reject);
    req.write(data);
    req.end();
  });
}

function getContent(token) {
  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        host: "localhost", port: 3017, path: "/api/v1/pib/content/1", method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      },
      (res) => {
        let body = "";
        res.on("data", (c) => (body += c));
        res.on("end", () => resolve({ status: res.statusCode, body }));
      }
    );
    req.on("error", reject);
    req.end();
  });
}

function upload(token, moduleNumber, weekNumber, title) {
  return new Promise((resolve, reject) => {
    const pdfPath = path.join(process.env.TEMP || ".", `e2e-m${moduleNumber}-w${weekNumber}-${Date.now()}.pdf`);
    fs.writeFileSync(pdfPath, Buffer.from(`%PDF-1.4\n%E2E test material m${moduleNumber} w${weekNumber} ${Date.now()}\n%%EOF`));
    const boundary = "----E2EBoundary" + Date.now();
    const filename = `e2e-m${moduleNumber}-w${weekNumber}.pdf`;
    const parts = [
      Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="title"\r\n\r\n${title}\r\n`),
      Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${filename}"\r\nContent-Type: application/pdf\r\n\r\n`),
      fs.readFileSync(pdfPath),
      Buffer.from(`\r\n--${boundary}--\r\n`),
    ];
    const body = Buffer.concat(parts);
    const headers = {
      "Content-Type": `multipart/form-data; boundary=${boundary}`,
      "Content-Length": body.length,
      Authorization: `Bearer ${token}`,
    };
    const req = http.request(
      {
        host: "localhost", port: 3017,
        path: `/api/v1/pib/content/${moduleNumber}/week/${weekNumber}/material`,
        method: "POST", headers,
      },
      (res) => {
        let resp = "";
        res.on("data", (c) => (resp += c));
        res.on("end", () => resolve({ status: res.statusCode, body: resp, filePath: pdfPath }));
      }
    );
    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

function del(token, moduleNumber, weekNumber, materialId) {
  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        host: "localhost", port: 3017,
        path: `/api/v1/pib/content/${moduleNumber}/week/${weekNumber}/material/${materialId}`,
        method: "DELETE", headers: { Authorization: `Bearer ${token}` },
      },
      (res) => {
        let body = "";
        res.on("data", (c) => (body += c));
        res.on("end", () => resolve({ status: res.statusCode, body }));
      }
    );
    req.on("error", reject);
    req.end();
  });
}

let pass = 0, fail = 0;
const check = (label, ok, info) => {
  if (ok) {
    console.log(`  [PASS] ${label}${info ? ` — ${info}` : ""}`);
    pass++;
  } else {
    console.log(`  [FAIL] ${label}${info ? ` — ${info}` : ""}`);
    fail++;
  }
};

async function main() {
  console.log("\n=== PIB Material Upload E2E test ===\n");

  const r = await login();
  if (r.status !== 200) {
    console.log("LOGIN FAILED:", r.status, r.body);
    process.exit(1);
  }
  let token;
  try {
    token = JSON.parse(r.body);
  } catch {
    token = r.body;
  }
  console.log("Login OK (token len:", token.length, ")");

  // ---- 1. Upload to existing weeks (1..4) ----
  console.log("\n[1] Upload to existing weeks of Module 1");
  const before = JSON.parse((await getContent(token)).body);
  before.weeklyContent.forEach((w) =>
    console.log(`     before W${w.weekNumber}: ${(w.materials || []).length} materials`)
  );

  const createdIds = [];
  for (const w of [1, 2, 3, 4]) {
    const title = `E2E Semana ${w} ${Date.now()}`;
    const u = await upload(token, 1, w, title);
    check(`Upload M1 W${w}`, u.status === 201, `HTTP ${u.status} ${u.body.slice(0, 80)}`);
    if (u.status === 201) {
      try {
        const obj = JSON.parse(u.body);
        if (obj._id) createdIds.push({ w, id: obj._id, filePath: u.filePath });
      } catch {}
    }
  }

  // ---- 2. Auth error response is JSON ----
  console.log("\n[2] Auth error response is JSON (not plain text)");
  await new Promise((resolve) => {
    const req = http.request(
      {
        host: "localhost", port: 3017,
        path: "/api/v1/pib/content/1/week/4/material",
        method: "POST", headers: { "Content-Type": "multipart/form-data; boundary=x", "Content-Length": 0 },
      },
      (res) => {
        let body = "";
        res.on("data", (c) => (body += c));
        res.on("end", () => {
          let parsed = null;
          try { parsed = JSON.parse(body); } catch {}
          check(
            `Missing-token response is JSON 401`,
            res.statusCode === 401 && parsed && parsed.message,
            `HTTP ${res.statusCode}, content-type=${res.headers["content-type"]}, body=${body.slice(0, 120)}`
          );
          resolve();
        });
      }
    );
    req.end();
  });

  // ---- 3. Bad-token response is JSON ----
  await new Promise((resolve) => {
    const req = http.request(
      {
        host: "localhost", port: 3017,
        path: "/api/v1/pib/content/1/week/4/material",
        method: "POST",
        headers: {
          "Content-Type": "multipart/form-data; boundary=x",
          "Content-Length": 0,
          "Authorization": "Bearer notavalidtoken",
        },
      },
      (res) => {
        let body = "";
        res.on("data", (c) => (body += c));
        res.on("end", () => {
          let parsed = null;
          try { parsed = JSON.parse(body); } catch {}
          check(
            `Bad-token response is JSON 401`,
            res.statusCode === 401 && parsed && parsed.message,
            `HTTP ${res.statusCode}, body=${body.slice(0, 120)}`
          );
          resolve();
        });
      }
    );
    req.end();
  });

  // ---- 4. Auto-seed: simulate a week missing from DB ----
  console.log("\n[3] Auto-seed of missing week");
  await mongoose.connect("mongodb://localhost:27017/Expreso", { serverSelectionTimeoutMS: 5000 });
  const coll = mongoose.connection.collection("pibcontents");
  // Module 2 (weeks 5-8). Remove week 7 from its weeklyContent to simulate the user's bug.
  const mod2Before = await coll.findOne({ moduleNumber: 2 });
  const mod2WeeksBefore = (mod2Before?.weeklyContent || []).map((w) => w.weekNumber);
  console.log(`     Module 2 weeks before: [${mod2WeeksBefore.join(",")}]`);
  await coll.updateOne(
    { moduleNumber: 2 },
    { $pull: { weeklyContent: { weekNumber: 7 } } }
  );

  // Now try uploading to module 2 week 7 — should auto-seed week 7 and return 201.
  const u2w7 = await upload(token, 2, 7, "Auto-seed week 7 of module 2");
  check(
    `Upload to missing week auto-seeds`,
    u2w7.status === 201,
    `HTTP ${u2w7.status} ${u2w7.body.slice(0, 120)}`
  );
  // Cleanup
  if (u2w7.status === 201) {
    try {
      const obj = JSON.parse(u2w7.body);
      await del(token, 2, 7, obj._id);
    } catch {}
  }
  // Restore module 2 week 7 to its original seed
  const mod2After = await coll.findOne({ moduleNumber: 2 });
  const mod2WeeksAfter = (mod2After?.weeklyContent || []).map((w) => w.weekNumber);
  console.log(`     Module 2 weeks after: [${mod2WeeksAfter.join(",")}]`);
  if (!mod2WeeksAfter.includes(7)) {
    await coll.updateOne(
      { moduleNumber: 2 },
      {
        $push: {
          weeklyContent: {
            weekNumber: 7,
            title: "Patrones Emocionales",
            description: "Reconociendo y transformando",
            videos: [],
            materials: [],
          },
        },
      }
    );
    await coll.updateOne(
      { moduleNumber: 2 },
      [{ $set: { weeklyContent: { $sortArray: { input: "$weeklyContent", sortBy: { weekNumber: 1 } } } } }]
    );
    console.log("     Module 2 week 7 reinserted to restore original seed.");
  }
  await mongoose.disconnect();

  // ---- 5. String-tolerance: simulate weekNumber stored as string ----
  console.log("\n[4] Defensive lookup when weekNumber is stored as string");
  await mongoose.connect("mongodb://localhost:27017/Expreso", { serverSelectionTimeoutMS: 5000 });
  // Temporarily corrupt module 1 week 4 to have string weekNumber
  await coll.updateOne(
    { moduleNumber: 1, "weeklyContent.weekNumber": 4 },
    { $set: { "weeklyContent.$.weekNumber": "4" } }
  );
  const uStr = await upload(token, 1, 4, "String weekNumber tolerance test");
  check(
    `Upload with string weekNumber in DB still works`,
    uStr.status === 201,
    `HTTP ${uStr.status} ${uStr.body.slice(0, 120)}`
  );
  if (uStr.status === 201) {
    try {
      const obj = JSON.parse(uStr.body);
      await del(token, 1, 4, obj._id);
    } catch {}
  }
  // Restore week 4 to number type
  await coll.updateOne(
    { moduleNumber: 1, "weeklyContent.weekNumber": "4" },
    { $set: { "weeklyContent.$.weekNumber": 4 } }
  );
  await mongoose.disconnect();

  // ---- Cleanup the test materials we created in section [1] ----
  console.log("\n[5] Cleanup of test artifacts");
  for (const c of createdIds) {
    const d = await del(token, 1, c.w, c.id);
    console.log(`     Delete M1 W${c.w}: HTTP ${d.status}`);
    try { fs.unlinkSync(c.filePath); } catch {}
  }
  const dir = path.join(process.cwd(), "uploads", "pib-materials");
  const files = fs.existsSync(dir) ? fs.readdirSync(dir) : [];
  console.log(`     uploads/pib-materials/: ${files.join(", ") || "(empty)"}`);

  console.log(`\n=== RESULT: ${pass} pass, ${fail} fail ===`);
  process.exit(fail > 0 ? 1 : 0);
}
main().catch((e) => { console.error("ERR:", e); process.exit(1); });
