import { tool as langchainTool } from "@langchain/core/tools";
import { z, ZodObject, ZodRawShape } from "zod";

export function safeTool<T extends ZodRawShape>(
  fn: (args: z.infer<ZodObject<T>>) => Promise<string>,
  opts: {
    name: string;
    description: string;
    schema: ZodObject<T>;
  }
) {
  return langchainTool(
    async (args: z.infer<ZodObject<T>>) => {
      try {
        return await fn(args);
      } catch (e) {
        return `Error: ${e instanceof Error ? e.message : String(e)}`;
      }
    },
    {
      name: opts.name,
      description: opts.description,
      schema: opts.schema,
    }
  );
}
