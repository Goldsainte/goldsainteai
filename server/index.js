import { createServer } from "./app.js";

if (process.env.NODE_ENV !== "test") {
  createServer();
}

export default createServer;
