const BACKEND_BASE = "http://98.70.223.78";

function resolveRequestBody(req, method, headers) {
  if (["GET", "HEAD"].includes(method)) {
    return undefined;
  }

  const contentType = (headers["content-type"] || headers["Content-Type"] || "").toLowerCase();
  const expectsBinary =
    contentType.includes("multipart/form-data") ||
    contentType.includes("application/octet-stream") ||
    contentType.startsWith("image/");

  if (Buffer.isBuffer(req.rawBody)) {
    return req.rawBody;
  }

  if (Buffer.isBuffer(req.body)) {
    return req.body;
  }

  if (req.body instanceof Uint8Array) {
    return Buffer.from(req.body);
  }

  if (typeof req.rawBody === "string") {
    if (expectsBinary) {
      return Buffer.from(req.rawBody, "binary");
    }
    return req.rawBody;
  }

  if (typeof req.body === "string") {
    if (expectsBinary) {
      return Buffer.from(req.body, "binary");
    }
    return req.body;
  }

  if (req.body !== undefined && req.body !== null) {
    if (!headers["content-type"] && !headers["Content-Type"]) {
      headers["content-type"] = "application/json";
    }
    return JSON.stringify(req.body);
  }

  return undefined;
}

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
  delete outboundHeaders["transfer-encoding"];

  const body = resolveRequestBody(req, method, outboundHeaders);

  try {
    const response = await fetch(targetUrl.toString(), {
      method,
      headers: outboundHeaders,
      body,
      redirect: "manual"
    });

    const responseHeaders = {};

    response.headers.forEach((value, key) => {
      const lower = key.toLowerCase();
      if (lower === "transfer-encoding") {
        return;
      }
      responseHeaders[key] = value;
    });

    const contentType = (response.headers.get("content-type") || "").toLowerCase();
    const isTextLike =
      contentType.includes("application/json") ||
      contentType.startsWith("text/") ||
      contentType.includes("application/javascript") ||
      contentType.includes("application/xml") ||
      contentType.includes("application/x-www-form-urlencoded");

    if (isTextLike) {
      const textBody = await response.text();
      return {
        status: response.status,
        headers: responseHeaders,
        body: textBody,
      };
    }

    const responseBuffer = Buffer.from(await response.arrayBuffer());

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
