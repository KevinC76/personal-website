import seed from "./seed.json";
import { portfolioSchema } from "./schema";
export const defaultContent = portfolioSchema.parse(seed);
