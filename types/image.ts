export type ImageAsset = {
  uri: string;
  name: string;
  type: string;
  /** Present only for newly picked images; omitted for existing remote URLs when editing. */
  base64?: string;
};

