const BACKEND_BASE = "http://98.70.223.78";

module.exports = async function (context, req) {
  const path = (context.bindingData.path || "").replace(/^\/+/, "");
  const incomingUrl = new URL(req.url);
  const targetUrl = new URL(`${BACKEND_BASE}/${path}`);
  targetUrl.search = incomingUrl.search;

  const method = (req.method || "GET").toUpperCase();

  if (method === "OPTIONS") {
    return {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS,HEAD",
        "Access-Control-Allow-Headers": "*"
      }
    };
  }

  const outboundHeaders = { ...req.headers };
  delete outboundHeaders.host;
  delete outboundHeaders["content-length"];

  let body;
  if (!["GET", "HEAD"].includes(method)) {
    if (typeof req.rawBody === "string" || req.rawBody instanceof Buffer) {
      body = req.rawBody;
    } else if (req.body !== undefined && req.body !== null) {
      body = typeof req.body === "string" ? req.body : JSON.stringify(req.body);
      if (!outboundHeaders["content-type"]) {
        outboundHeaders["content-type"] = "application/json";
      }
    }
  }

  try {
    const response = await fetch(targetUrl.toString(), {
      method,
      headers: outboundHeaders,
      body,
      redirect: "manual"
    });

    const responseBuffer = Buffer.from(await response.arrayBuffer());
    const responseHeaders = {};

    response.headers.forEach((value, key) => {
      const lower = key.toLowerCase();
      if (lower === "transfer-encoding") {
        return;
      }
      responseHeaders[key] = value;
    });

    return {
      status: response.status,
      headers: responseHeaders,
      body: responseBuffer,
      isRaw: true
    };
  } catch (error) {
    context.log.error("Proxy request failed:", error);
    return {
      status: 502,
      jsonBody: {
        detail: "Backend proxy failed",
        error: error.message || "Unknown error"
      }
    };
  }
};
