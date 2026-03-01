import { z } from "zod";

const YachtFilterSchema = z.object({
  manufacturers: z.string().array().optional(),
  rigTypes: z.string().array().optional(),
  keelTypes: z.string().array().optional(),
  hullMaterials: z.string().array().optional(),
  lengthMin: z.string().optional(),
  lengthMax: z.string().optional(),
  beamMin: z.string().optional(),
  beamMax: z.string().optional(),
  draftMin: z.string().optional(),
  draftMax: z.string().optional(),
  displacementMin: z.string().optional(),
  displacementMax: z.string().optional(),
  sailAreaMin: z.string().optional(),
  sailAreaMax: z.string().optional(),
});

type YachtFilters = z.infer<typeof YachtFilterSchema>;

export { YachtFilterSchema };
export type { YachtFilters };
