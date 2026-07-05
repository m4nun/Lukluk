const YAML_TO_FOLDER: Record<string, string> = {
  "american-shorthair": "american-shorthair-cat",
  sphynx: "sphynx-cat",
};

export function getPetLogo(petTypeProfileId: string): string | null {
  const folder = YAML_TO_FOLDER[petTypeProfileId] || petTypeProfileId;
  return `/assets/PetLogo/${folder}/1.png`;
}
