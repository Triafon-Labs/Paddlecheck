// The club's settings file (clubs/<CLUB>.yaml, aliased in next.config.ts) is
// read by yaml-loader and checked by lib/clubConfig.ts, so it arrives untyped.
declare module "*.yaml" {
  const value: unknown;
  export default value;
}

declare module "@club-config" {
  const value: unknown;
  export default value;
}
