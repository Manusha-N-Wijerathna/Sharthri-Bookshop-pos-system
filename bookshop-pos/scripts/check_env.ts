import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const url = new URL(process.env.DATABASE_URL!);
console.log("Protocol:", url.protocol);
console.log("Host:", url.host);
console.log("Port:", url.port);
console.log("Pathname:", url.pathname);
console.log("SearchParams:", url.search);

