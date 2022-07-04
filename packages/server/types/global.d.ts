declare module 'xx'

interface Require {
  (id: string): any;
  resolve: RequireResolve;
  cache: any;
}
