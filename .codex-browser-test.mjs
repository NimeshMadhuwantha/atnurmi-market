import process from "node:process";

const endpoint = process.argv[2];
const token = process.env.ATNURMI_UI_TEST_TOKEN;
const imagePath = process.argv[3];
if (!endpoint || !token || !imagePath) throw new Error("Missing browser test arguments.");

const targets = await fetch(`${endpoint}/json/list`).then((response) => response.json());
const page = targets.find((target) => target.type === "page");
if (!page) throw new Error("No browser page target found.");
const socket = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((resolve, reject) => {
  socket.addEventListener("open", resolve, { once: true });
  socket.addEventListener("error", reject, { once: true });
});

let nextId = 0;
const pending = new Map();
socket.addEventListener("message", (event) => {
  const message = JSON.parse(event.data);
  if (!message.id || !pending.has(message.id)) return;
  const { resolve, reject } = pending.get(message.id);
  pending.delete(message.id);
  if (message.error) reject(new Error(message.error.message));
  else resolve(message.result);
});

function send(method, params = {}) {
  const id = ++nextId;
  socket.send(JSON.stringify({ id, method, params }));
  return new Promise((resolve, reject) => pending.set(id, { resolve, reject }));
}

async function evaluate(expression) {
  const result = await send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true });
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.text);
  return result.result.value;
}

async function waitFor(expression, timeout = 30000) {
  const started = Date.now();
  while (Date.now() - started < timeout) {
    if (await evaluate(expression)) return;
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
  throw new Error(`Timed out waiting for: ${expression}`);
}

await send("Page.enable");
await send("DOM.enable");
await send("Page.navigate", { url: `http://127.0.0.1:3000/__ui-test#${token}` });
await waitFor("location.pathname === '/my-arts' && !!document.querySelector('.manager-bar .primary')", 45000);
await evaluate("document.querySelector('.manager-bar .primary').click(); true");
await waitFor("!!document.querySelector('.art-form-modal form')");

const documentNode = await send("DOM.getDocument", { depth: -1, pierce: true });
const fileInputs = await send("DOM.querySelectorAll", { nodeId: documentNode.root.nodeId, selector: ".image-upload-row input[type=file]" });
if (fileInputs.nodeIds.length !== 3) throw new Error(`Expected 3 file inputs, found ${fileInputs.nodeIds.length}.`);
for (const nodeId of fileInputs.nodeIds) {
  await send("DOM.setFileInputFiles", { nodeId, files: [imagePath] });
}

await evaluate(`(() => {
  const set = (selector, value) => {
    const element = document.querySelector(selector);
    const setter = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(element), 'value').set;
    setter.call(element, value);
    element.dispatchEvent(new Event('input', { bubbles: true }));
    element.dispatchEvent(new Event('change', { bubbles: true }));
  };
  set('[name=name]', 'UI Publish Test');
  set('[name=size]', '40 x 30 cm');
  set('[name=medium]', 'Digital print');
  set('[name=materials]', 'Archival paper');
  set('[name=description]', 'Automated browser verification artwork description.');
  set('[name=price]', '12500');
  set('[name=deliveryCharge]', '500');
  return true;
})()`);

await waitFor("document.querySelectorAll('.image-upload-row span').length === 3 && [...document.querySelectorAll('.image-upload-row span')].every((item) => item.textContent.includes('Ready'))", 45000);
const buttonState = await evaluate("({ disabled: document.querySelector('.art-form button[type=submit]').disabled, text: document.querySelector('.art-form button[type=submit]').textContent, status: document.querySelector('.image-status')?.textContent })");
await evaluate("document.querySelector('.art-form button[type=submit]').click(); true");
await waitFor("!!document.querySelector('.success-state')", 45000);
const success = await evaluate("document.querySelector('.success-state h2').textContent");
console.log(JSON.stringify({ buttonState, success }));
socket.close();
