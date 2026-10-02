import { createServer } from "http";
import { parse } from "url";
import next from "next";
import { Server } from "socket.io";
import { attachGame } from "./lib/game";

const dev = process.env.NODE_ENV !== "production";
const hostname = process.env.HOSTNAME || "0.0.0.0";
const port = parseInt(process.env.PORT || "3000", 10);

const app = next({ dev, hostname: "localhost", port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    if (req.url?.startsWith("/socket.io")) return;
    const parsedUrl = parse(req.url || "/", true);
    void handle(req, res, parsedUrl);
  });

  const io = new Server(httpServer, {
    cors: { origin: "*" },
  });
  attachGame(io);

  httpServer.listen(port, hostname, () => {
    console.log(`TechQuzz ready on http://${hostname}:${port}`);
  });
});
