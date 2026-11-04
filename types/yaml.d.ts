// club.yaml is read by yaml-loader (next.config.ts) and checked by
// lib/clubConfig.ts, so it arrives untyped.
declare module "*.yaml" {
  const value: unknown;
  export default value;
}
