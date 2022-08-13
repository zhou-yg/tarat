
/**
 * Client
**/

import * as runtime from './runtime/index';
declare const prisma: unique symbol
export type PrismaPromise<A> = Promise<A> & {[prisma]: true}
type UnwrapPromise<P extends any> = P extends Promise<infer R> ? R : P
type UnwrapTuple<Tuple extends readonly unknown[]> = {
  [K in keyof Tuple]: K extends `${number}` ? Tuple[K] extends PrismaPromise<infer X> ? X : UnwrapPromise<Tuple[K]> : UnwrapPromise<Tuple[K]>
};


/**
 * Model Markdown
 * 
 */
export type Markdown = {
  id: number
  createdAt: Date
  modifiedAt: Date
  content: string
}

/**
 * Model MarkdownX
 * 
 */
export type MarkdownX = {
  id: number
  createdAt: Date
  modifiedAt: Date
  content: string
}


/**
 * ##  Prisma Client ʲˢ
 * 
 * Type-safe database client for TypeScript & Node.js
 * @example
 * ```
 * const prisma = new PrismaClient()
 * // Fetch zero or more Markdowns
 * const markdowns = await prisma.markdown.findMany()
 * ```
 *
 * 
 * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client).
 */
export class PrismaClient<
  T extends Prisma.PrismaClientOptions = Prisma.PrismaClientOptions,
  U = 'log' extends keyof T ? T['log'] extends Array<Prisma.LogLevel | Prisma.LogDefinition> ? Prisma.GetEvents<T['log']> : never : never,
  GlobalReject = 'rejectOnNotFound' extends keyof T
    ? T['rejectOnNotFound']
    : false
      > {
      /**
       * @private
       */
      private fetcher;
      /**
       * @private
       */
      private readonly dmmf;
      /**
       * @private
       */
      private connectionPromise?;
      /**
       * @private
       */
      private disconnectionPromise?;
      /**
       * @private
       */
      private readonly engineConfig;
      /**
       * @private
       */
      private readonly measurePerformance;

    /**
   * ##  Prisma Client ʲˢ
   * 
   * Type-safe database client for TypeScript & Node.js
   * @example
   * ```
   * const prisma = new PrismaClient()
   * // Fetch zero or more Markdowns
   * const markdowns = await prisma.markdown.findMany()
   * ```
   *
   * 
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client).
   */

  constructor(optionsArg ?: Prisma.Subset<T, Prisma.PrismaClientOptions>);
  $on<V extends (U | 'beforeExit')>(eventType: V, callback: (event: V extends 'query' ? Prisma.QueryEvent : V extends 'beforeExit' ? () => Promise<void> : Prisma.LogEvent) => void): void;

  /**
   * Connect with the database
   */
  $connect(): Promise<void>;

  /**
   * Disconnect from the database
   */
  $disconnect(): Promise<void>;

  /**
   * Add a middleware
   */
  $use(cb: Prisma.Middleware): void

/**
   * Executes a prepared raw query and returns the number of affected rows.
   * @example
   * ```
   * const result = await prisma.$executeRaw`UPDATE User SET cool = ${true} WHERE email = ${'user@email.com'};`
   * ```
   * 
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $executeRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: any[]): PrismaPromise<number>;

  /**
   * Executes a raw query and returns the number of affected rows.
   * Susceptible to SQL injections, see documentation.
   * @example
   * ```
   * const result = await prisma.$executeRawUnsafe('UPDATE User SET cool = $1 WHERE email = $2 ;', true, 'user@email.com')
   * ```
   * 
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $executeRawUnsafe<T = unknown>(query: string, ...values: any[]): PrismaPromise<number>;

  /**
   * Performs a prepared raw query and returns the `SELECT` data.
   * @example
   * ```
   * const result = await prisma.$queryRaw`SELECT * FROM User WHERE id = ${1} OR email = ${'user@email.com'};`
   * ```
   * 
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $queryRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: any[]): PrismaPromise<T>;

  /**
   * Performs a raw query and returns the `SELECT` data.
   * Susceptible to SQL injections, see documentation.
   * @example
   * ```
   * const result = await prisma.$queryRawUnsafe('SELECT * FROM User WHERE id = $1 OR email = $2;', 1, 'user@email.com')
   * ```
   * 
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $queryRawUnsafe<T = unknown>(query: string, ...values: any[]): PrismaPromise<T>;

  /**
   * Allows the running of a sequence of read/write operations that are guaranteed to either succeed or fail as a whole.
   * @example
   * ```
   * const [george, bob, alice] = await prisma.$transaction([
   *   prisma.user.create({ data: { name: 'George' } }),
   *   prisma.user.create({ data: { name: 'Bob' } }),
   *   prisma.user.create({ data: { name: 'Alice' } }),
   * ])
   * ```
   * 
   * Read more in our [docs](https://www.prisma.io/docs/concepts/components/prisma-client/transactions).
   */
  $transaction<P extends PrismaPromise<any>[]>(arg: [...P]): Promise<UnwrapTuple<P>>;

      /**
   * `prisma.markdown`: Exposes CRUD operations for the **Markdown** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Markdowns
    * const markdowns = await prisma.markdown.findMany()
    * ```
    */
  get markdown(): Prisma.MarkdownDelegate<GlobalReject>;

  /**
   * `prisma.markdownX`: Exposes CRUD operations for the **MarkdownX** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more MarkdownXES
    * const markdownXES = await prisma.markdownX.findMany()
    * ```
    */
  get markdownX(): Prisma.MarkdownXDelegate<GlobalReject>;
}

export namespace Prisma {
  export import DMMF = runtime.DMMF

  /**
   * Prisma Errors
   */
  export import PrismaClientKnownRequestError = runtime.PrismaClientKnownRequestError
  export import PrismaClientUnknownRequestError = runtime.PrismaClientUnknownRequestError
  export import PrismaClientRustPanicError = runtime.PrismaClientRustPanicError
  export import PrismaClientInitializationError = runtime.PrismaClientInitializationError
  export import PrismaClientValidationError = runtime.PrismaClientValidationError

  /**
   * Re-export of sql-template-tag
   */
  export import sql = runtime.sqltag
  export import empty = runtime.empty
  export import join = runtime.join
  export import raw = runtime.raw
  export import Sql = runtime.Sql

  /**
   * Decimal.js
   */
  export import Decimal = runtime.Decimal

  export type DecimalJsLike = runtime.DecimalJsLike

  /**
   * Prisma Client JS version: 3.15.1
   * Query Engine version: 461d6a05159055555eb7dfb337c9fb271cbd4d7e
   */
  export type PrismaVersion = {
    client: string
  }

  export const prismaVersion: PrismaVersion 

  /**
   * Utility Types
   */

  /**
   * From https://github.com/sindresorhus/type-fest/
   * Matches a JSON object.
   * This type can be useful to enforce some input to be JSON-compatible or as a super-type to be extended from. 
   */
  export type JsonObject = {[Key in string]?: JsonValue}

  /**
   * From https://github.com/sindresorhus/type-fest/
   * Matches a JSON array.
   */
  export interface JsonArray extends Array<JsonValue> {}

  /**
   * From https://github.com/sindresorhus/type-fest/
   * Matches any valid JSON value.
   */
  export type JsonValue = string | number | boolean | JsonObject | JsonArray | null

  /**
   * Matches a JSON object.
   * Unlike `JsonObject`, this type allows undefined and read-only properties.
   */
  export type InputJsonObject = {readonly [Key in string]?: InputJsonValue | null}

  /**
   * Matches a JSON array.
   * Unlike `JsonArray`, readonly arrays are assignable to this type.
   */
  export interface InputJsonArray extends ReadonlyArray<InputJsonValue | null> {}

  /**
   * Matches any valid value that can be used as an input for operations like
   * create and update as the value of a JSON field. Unlike `JsonValue`, this
   * type allows read-only arrays and read-only object properties and disallows
   * `null` at the top level.
   *
   * `null` cannot be used as the value of a JSON field because its meaning
   * would be ambiguous. Use `Prisma.JsonNull` to store the JSON null value or
   * `Prisma.DbNull` to clear the JSON value and set the field to the database
   * NULL value instead.
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-by-null-values
   */
  export type InputJsonValue = string | number | boolean | InputJsonObject | InputJsonArray

  /**
   * Helper for filtering JSON entries that have `null` on the database (empty on the db)
   * 
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const DbNull: 'DbNull'

  /**
   * Helper for filtering JSON entries that have JSON `null` values (not empty on the db)
   * 
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const JsonNull: 'JsonNull'

  /**
   * Helper for filtering JSON entries that are `Prisma.DbNull` or `Prisma.JsonNull`
   * 
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const AnyNull: 'AnyNull'

  type SelectAndInclude = {
    select: any
    include: any
  }
  type HasSelect = {
    select: any
  }
  type HasInclude = {
    include: any
  }
  type CheckSelect<T, S, U> = T extends SelectAndInclude
    ? 'Please either choose `select` or `include`'
    : T extends HasSelect
    ? U
    : T extends HasInclude
    ? U
    : S

  /**
   * Get the type of the value, that the Promise holds.
   */
  export type PromiseType<T extends PromiseLike<any>> = T extends PromiseLike<infer U> ? U : T;

  /**
   * Get the return type of a function which returns a Promise.
   */
  export type PromiseReturnType<T extends (...args: any) => Promise<any>> = PromiseType<ReturnType<T>>

  /**
   * From T, pick a set of properties whose keys are in the union K
   */
  type Prisma__Pick<T, K extends keyof T> = {
      [P in K]: T[P];
  };


  export type Enumerable<T> = T | Array<T>;

  export type RequiredKeys<T> = {
    [K in keyof T]-?: {} extends Prisma__Pick<T, K> ? never : K
  }[keyof T]

  export type TruthyKeys<T> = {
    [key in keyof T]: T[key] extends false | undefined | null ? never : key
  }[keyof T]

  export type TrueKeys<T> = TruthyKeys<Prisma__Pick<T, RequiredKeys<T>>>

  /**
   * Subset
   * @desc From `T` pick properties that exist in `U`. Simple version of Intersection
   */
  export type Subset<T, U> = {
    [key in keyof T]: key extends keyof U ? T[key] : never;
  };

  /**
   * SelectSubset
   * @desc From `T` pick properties that exist in `U`. Simple version of Intersection.
   * Additionally, it validates, if both select and include are present. If the case, it errors.
   */
  export type SelectSubset<T, U> = {
    [key in keyof T]: key extends keyof U ? T[key] : never
  } &
    (T extends SelectAndInclude
      ? 'Please either choose `select` or `include`.'
      : {})

  /**
   * Subset + Intersection
   * @desc From `T` pick properties that exist in `U` and intersect `K`
   */
  export type SubsetIntersection<T, U, K> = {
    [key in keyof T]: key extends keyof U ? T[key] : never
  } &
    K

  type Without<T, U> = { [P in Exclude<keyof T, keyof U>]?: never };

  /**
   * XOR is needed to have a real mutually exclusive union type
   * https://stackoverflow.com/questions/42123407/does-typescript-support-mutually-exclusive-types
   */
  type XOR<T, U> =
    T extends object ?
    U extends object ?
      (Without<T, U> & U) | (Without<U, T> & T)
    : U : T


  /**
   * Is T a Record?
   */
  type IsObject<T extends any> = T extends Array<any>
  ? False
  : T extends Date
  ? False
  : T extends Buffer
  ? False
  : T extends BigInt
  ? False
  : T extends object
  ? True
  : False


  /**
   * If it's T[], return T
   */
  export type UnEnumerate<T extends unknown> = T extends Array<infer U> ? U : T

  /**
   * From ts-toolbelt
   */

  type __Either<O extends object, K extends Key> = Omit<O, K> &
    {
      // Merge all but K
      [P in K]: Prisma__Pick<O, P & keyof O> // With K possibilities
    }[K]

  type EitherStrict<O extends object, K extends Key> = Strict<__Either<O, K>>

  type EitherLoose<O extends object, K extends Key> = ComputeRaw<__Either<O, K>>

  type _Either<
    O extends object,
    K extends Key,
    strict extends Boolean
  > = {
    1: EitherStrict<O, K>
    0: EitherLoose<O, K>
  }[strict]

  type Either<
    O extends object,
    K extends Key,
    strict extends Boolean = 1
  > = O extends unknown ? _Either<O, K, strict> : never

  export type Union = any

  type PatchUndefined<O extends object, O1 extends object> = {
    [K in keyof O]: O[K] extends undefined ? At<O1, K> : O[K]
  } & {}

  /** Helper Types for "Merge" **/
  export type IntersectOf<U extends Union> = (
    U extends unknown ? (k: U) => void : never
  ) extends (k: infer I) => void
    ? I
    : never

  export type Overwrite<O extends object, O1 extends object> = {
      [K in keyof O]: K extends keyof O1 ? O1[K] : O[K];
  } & {};

  type _Merge<U extends object> = IntersectOf<Overwrite<U, {
      [K in keyof U]-?: At<U, K>;
  }>>;

  type Key = string | number | symbol;
  type AtBasic<O extends object, K extends Key> = K extends keyof O ? O[K] : never;
  type AtStrict<O extends object, K extends Key> = O[K & keyof O];
  type AtLoose<O extends object, K extends Key> = O extends unknown ? AtStrict<O, K> : never;
  export type At<O extends object, K extends Key, strict extends Boolean = 1> = {
      1: AtStrict<O, K>;
      0: AtLoose<O, K>;
  }[strict];

  export type ComputeRaw<A extends any> = A extends Function ? A : {
    [K in keyof A]: A[K];
  } & {};

  export type OptionalFlat<O> = {
    [K in keyof O]?: O[K];
  } & {};

  type _Record<K extends keyof any, T> = {
    [P in K]: T;
  };

  type _Strict<U, _U = U> = U extends unknown ? U & OptionalFlat<_Record<Exclude<Keys<_U>, keyof U>, never>> : never;

  export type Strict<U extends object> = ComputeRaw<_Strict<U>>;
  /** End Helper Types for "Merge" **/

  export type Merge<U extends object> = ComputeRaw<_Merge<Strict<U>>>;

  /**
  A [[Boolean]]
  */
  export type Boolean = True | False

  // /**
  // 1
  // */
  export type True = 1

  /**
  0
  */
  export type False = 0

  export type Not<B extends Boolean> = {
    0: 1
    1: 0
  }[B]

  export type Extends<A1 extends any, A2 extends any> = [A1] extends [never]
    ? 0 // anything `never` is false
    : A1 extends A2
    ? 1
    : 0

  export type Has<U extends Union, U1 extends Union> = Not<
    Extends<Exclude<U1, U>, U1>
  >

  export type Or<B1 extends Boolean, B2 extends Boolean> = {
    0: {
      0: 0
      1: 1
    }
    1: {
      0: 1
      1: 1
    }
  }[B1][B2]

  export type Keys<U extends Union> = U extends unknown ? keyof U : never

  type Exact<A, W = unknown> = 
  W extends unknown ? A extends Narrowable ? Cast<A, W> : Cast<
  {[K in keyof A]: K extends keyof W ? Exact<A[K], W[K]> : never},
  {[K in keyof W]: K extends keyof A ? Exact<A[K], W[K]> : W[K]}>
  : never;

  type Narrowable = string | number | boolean | bigint;

  type Cast<A, B> = A extends B ? A : B;

  export const type: unique symbol;

  export function validator<V>(): <S>(select: Exact<S, V>) => S;

  /**
   * Used by group by
   */

  export type GetScalarType<T, O> = O extends object ? {
    [P in keyof T]: P extends keyof O
      ? O[P]
      : never
  } : never

  type FieldPaths<
    T,
    U = Omit<T, '_avg' | '_sum' | '_count' | '_min' | '_max'>
  > = IsObject<T> extends True ? U : T

  type GetHavingFields<T> = {
    [K in keyof T]: Or<
      Or<Extends<'OR', K>, Extends<'AND', K>>,
      Extends<'NOT', K>
    > extends True
      ? // infer is only needed to not hit TS limit
        // based on the brilliant idea of Pierre-Antoine Mills
        // https://github.com/microsoft/TypeScript/issues/30188#issuecomment-478938437
        T[K] extends infer TK
        ? GetHavingFields<UnEnumerate<TK> extends object ? Merge<UnEnumerate<TK>> : never>
        : never
      : {} extends FieldPaths<T[K]>
      ? never
      : K
  }[keyof T]

  /**
   * Convert tuple to union
   */
  type _TupleToUnion<T> = T extends (infer E)[] ? E : never
  type TupleToUnion<K extends readonly any[]> = _TupleToUnion<K>
  type MaybeTupleToUnion<T> = T extends any[] ? TupleToUnion<T> : T

  /**
   * Like `Pick`, but with an array
   */
  type PickArray<T, K extends Array<keyof T>> = Prisma__Pick<T, TupleToUnion<K>>

  /**
   * Exclude all keys with underscores
   */
  type ExcludeUnderscoreKeys<T extends string> = T extends `_${string}` ? never : T

  class PrismaClientFetcher {
    private readonly prisma;
    private readonly debug;
    private readonly hooks?;
    constructor(prisma: PrismaClient<any, any>, debug?: boolean, hooks?: Hooks | undefined);
    request<T>(document: any, dataPath?: string[], rootField?: string, typeName?: string, isList?: boolean, callsite?: string): Promise<T>;
    sanitizeMessage(message: string): string;
    protected unpack(document: any, data: any, path: string[], rootField?: string, isList?: boolean): any;
  }

  export const ModelName: {
    Markdown: 'Markdown',
    MarkdownX: 'MarkdownX'
  };

  export type ModelName = (typeof ModelName)[keyof typeof ModelName]


  export type Datasources = {
    db?: Datasource
  }

  export type RejectOnNotFound = boolean | ((error: Error) => Error)
  export type RejectPerModel = { [P in ModelName]?: RejectOnNotFound }
  export type RejectPerOperation =  { [P in "findUnique" | "findFirst"]?: RejectPerModel | RejectOnNotFound } 
  type IsReject<T> = T extends true ? True : T extends (err: Error) => Error ? True : False
  export type HasReject<
    GlobalRejectSettings extends Prisma.PrismaClientOptions['rejectOnNotFound'],
    LocalRejectSettings,
    Action extends PrismaAction,
    Model extends ModelName
  > = LocalRejectSettings extends RejectOnNotFound
    ? IsReject<LocalRejectSettings>
    : GlobalRejectSettings extends RejectPerOperation
    ? Action extends keyof GlobalRejectSettings
      ? GlobalRejectSettings[Action] extends RejectOnNotFound
        ? IsReject<GlobalRejectSettings[Action]>
        : GlobalRejectSettings[Action] extends RejectPerModel
        ? Model extends keyof GlobalRejectSettings[Action]
          ? IsReject<GlobalRejectSettings[Action][Model]>
          : False
        : False
      : False
    : IsReject<GlobalRejectSettings>
  export type ErrorFormat = 'pretty' | 'colorless' | 'minimal'

  export interface PrismaClientOptions {
    /**
     * Configure findUnique/findFirst to throw an error if the query returns null. 
     *  * @example
     * ```
     * // Reject on both findUnique/findFirst
     * rejectOnNotFound: true
     * // Reject only on findFirst with a custom error
     * rejectOnNotFound: { findFirst: (err) => new Error("Custom Error")}
     * // Reject on user.findUnique with a custom error
     * rejectOnNotFound: { findUnique: {User: (err) => new Error("User not found")}}
     * ```
     */
    rejectOnNotFound?: RejectOnNotFound | RejectPerOperation
    /**
     * Overwrites the datasource url from your prisma.schema file
     */
    datasources?: Datasources

    /**
     * @default "colorless"
     */
    errorFormat?: ErrorFormat

    /**
     * @example
     * ```
     * // Defaults to stdout
     * log: ['query', 'info', 'warn', 'error']
     * 
     * // Emit as events
     * log: [
     *  { emit: 'stdout', level: 'query' },
     *  { emit: 'stdout', level: 'info' },
     *  { emit: 'stdout', level: 'warn' }
     *  { emit: 'stdout', level: 'error' }
     * ]
     * ```
     * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/logging#the-log-option).
     */
    log?: Array<LogLevel | LogDefinition>
  }

  export type Hooks = {
    beforeRequest?: (options: { query: string, path: string[], rootField?: string, typeName?: string, document: any }) => any
  }

  /* Types for Logging */
  export type LogLevel = 'info' | 'query' | 'warn' | 'error'
  export type LogDefinition = {
    level: LogLevel
    emit: 'stdout' | 'event'
  }

  export type GetLogType<T extends LogLevel | LogDefinition> = T extends LogDefinition ? T['emit'] extends 'event' ? T['level'] : never : never
  export type GetEvents<T extends any> = T extends Array<LogLevel | LogDefinition> ?
    GetLogType<T[0]> | GetLogType<T[1]> | GetLogType<T[2]> | GetLogType<T[3]>
    : never

  export type QueryEvent = {
    timestamp: Date
    query: string
    params: string
    duration: number
    target: string
  }

  export type LogEvent = {
    timestamp: Date
    message: string
    target: string
  }
  /* End Types for Logging */


  export type PrismaAction =
    | 'findUnique'
    | 'findMany'
    | 'findFirst'
    | 'create'
    | 'createMany'
    | 'update'
    | 'updateMany'
    | 'upsert'
    | 'delete'
    | 'deleteMany'
    | 'executeRaw'
    | 'queryRaw'
    | 'aggregate'
    | 'count'
    | 'runCommandRaw'
    | 'findRaw'

  /**
   * These options are being passed in to the middleware as "params"
   */
  export type MiddlewareParams = {
    model?: ModelName
    action: PrismaAction
    args: any
    dataPath: string[]
    runInTransaction: boolean
  }

  /**
   * The `T` type makes sure, that the `return proceed` is not forgotten in the middleware implementation
   */
  export type Middleware<T = any> = (
    params: MiddlewareParams,
    next: (params: MiddlewareParams) => Promise<T>,
  ) => Promise<T>

  // tested in getLogLevel.test.ts
  export function getLogLevel(log: Array<LogLevel | LogDefinition>): LogLevel | undefined;

  export type Datasource = {
    url?: string
  }

  /**
   * Count Types
   */



  /**
   * Models
   */

  /**
   * Model Markdown
   */


  export type AggregateMarkdown = {
    _count: MarkdownCountAggregateOutputType | null
    _avg: MarkdownAvgAggregateOutputType | null
    _sum: MarkdownSumAggregateOutputType | null
    _min: MarkdownMinAggregateOutputType | null
    _max: MarkdownMaxAggregateOutputType | null
  }

  export type MarkdownAvgAggregateOutputType = {
    id: number | null
  }

  export type MarkdownSumAggregateOutputType = {
    id: number | null
  }

  export type MarkdownMinAggregateOutputType = {
    id: number | null
    createdAt: Date | null
    modifiedAt: Date | null
    content: string | null
  }

  export type MarkdownMaxAggregateOutputType = {
    id: number | null
    createdAt: Date | null
    modifiedAt: Date | null
    content: string | null
  }

  export type MarkdownCountAggregateOutputType = {
    id: number
    createdAt: number
    modifiedAt: number
    content: number
    _all: number
  }


  export type MarkdownAvgAggregateInputType = {
    id?: true
  }

  export type MarkdownSumAggregateInputType = {
    id?: true
  }

  export type MarkdownMinAggregateInputType = {
    id?: true
    createdAt?: true
    modifiedAt?: true
    content?: true
  }

  export type MarkdownMaxAggregateInputType = {
    id?: true
    createdAt?: true
    modifiedAt?: true
    content?: true
  }

  export type MarkdownCountAggregateInputType = {
    id?: true
    createdAt?: true
    modifiedAt?: true
    content?: true
    _all?: true
  }

  export type MarkdownAggregateArgs = {
    /**
     * Filter which Markdown to aggregate.
     * 
    **/
    where?: MarkdownWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Markdowns to fetch.
     * 
    **/
    orderBy?: Enumerable<MarkdownOrderByWithRelationInput>
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     * 
    **/
    cursor?: MarkdownWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Markdowns from the position of the cursor.
     * 
    **/
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Markdowns.
     * 
    **/
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Markdowns
    **/
    _count?: true | MarkdownCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: MarkdownAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: MarkdownSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: MarkdownMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: MarkdownMaxAggregateInputType
  }

  export type GetMarkdownAggregateType<T extends MarkdownAggregateArgs> = {
        [P in keyof T & keyof AggregateMarkdown]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateMarkdown[P]>
      : GetScalarType<T[P], AggregateMarkdown[P]>
  }




  export type MarkdownGroupByArgs = {
    where?: MarkdownWhereInput
    orderBy?: Enumerable<MarkdownOrderByWithAggregationInput>
    by: Array<MarkdownScalarFieldEnum>
    having?: MarkdownScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: MarkdownCountAggregateInputType | true
    _avg?: MarkdownAvgAggregateInputType
    _sum?: MarkdownSumAggregateInputType
    _min?: MarkdownMinAggregateInputType
    _max?: MarkdownMaxAggregateInputType
  }


  export type MarkdownGroupByOutputType = {
    id: number
    createdAt: Date
    modifiedAt: Date
    content: string
    _count: MarkdownCountAggregateOutputType | null
    _avg: MarkdownAvgAggregateOutputType | null
    _sum: MarkdownSumAggregateOutputType | null
    _min: MarkdownMinAggregateOutputType | null
    _max: MarkdownMaxAggregateOutputType | null
  }

  type GetMarkdownGroupByPayload<T extends MarkdownGroupByArgs> = PrismaPromise<
    Array<
      PickArray<MarkdownGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof MarkdownGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], MarkdownGroupByOutputType[P]>
            : GetScalarType<T[P], MarkdownGroupByOutputType[P]>
        }
      >
    >


  export type MarkdownSelect = {
    id?: boolean
    createdAt?: boolean
    modifiedAt?: boolean
    content?: boolean
  }

  export type MarkdownGetPayload<
    S extends boolean | null | undefined | MarkdownArgs,
    U = keyof S
      > = S extends true
        ? Markdown
    : S extends undefined
    ? never
    : S extends MarkdownArgs | MarkdownFindManyArgs
    ?'include' extends U
    ? Markdown 
    : 'select' extends U
    ? {
    [P in TrueKeys<S['select']>]:
    P extends keyof Markdown ? Markdown[P] : never
  } 
    : Markdown
  : Markdown


  type MarkdownCountArgs = Merge<
    Omit<MarkdownFindManyArgs, 'select' | 'include'> & {
      select?: MarkdownCountAggregateInputType | true
    }
  >

  export interface MarkdownDelegate<GlobalRejectSettings> {
    /**
     * Find zero or one Markdown that matches the filter.
     * @param {MarkdownFindUniqueArgs} args - Arguments to find a Markdown
     * @example
     * // Get one Markdown
     * const markdown = await prisma.markdown.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
    **/
    findUnique<T extends MarkdownFindUniqueArgs,  LocalRejectSettings = T["rejectOnNotFound"] extends RejectOnNotFound ? T['rejectOnNotFound'] : undefined>(
      args: SelectSubset<T, MarkdownFindUniqueArgs>
    ): HasReject<GlobalRejectSettings, LocalRejectSettings, 'findUnique', 'Markdown'> extends True ? CheckSelect<T, Prisma__MarkdownClient<Markdown>, Prisma__MarkdownClient<MarkdownGetPayload<T>>> : CheckSelect<T, Prisma__MarkdownClient<Markdown | null >, Prisma__MarkdownClient<MarkdownGetPayload<T> | null >>

    /**
     * Find the first Markdown that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {MarkdownFindFirstArgs} args - Arguments to find a Markdown
     * @example
     * // Get one Markdown
     * const markdown = await prisma.markdown.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
    **/
    findFirst<T extends MarkdownFindFirstArgs,  LocalRejectSettings = T["rejectOnNotFound"] extends RejectOnNotFound ? T['rejectOnNotFound'] : undefined>(
      args?: SelectSubset<T, MarkdownFindFirstArgs>
    ): HasReject<GlobalRejectSettings, LocalRejectSettings, 'findFirst', 'Markdown'> extends True ? CheckSelect<T, Prisma__MarkdownClient<Markdown>, Prisma__MarkdownClient<MarkdownGetPayload<T>>> : CheckSelect<T, Prisma__MarkdownClient<Markdown | null >, Prisma__MarkdownClient<MarkdownGetPayload<T> | null >>

    /**
     * Find zero or more Markdowns that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {MarkdownFindManyArgs=} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Markdowns
     * const markdowns = await prisma.markdown.findMany()
     * 
     * // Get first 10 Markdowns
     * const markdowns = await prisma.markdown.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const markdownWithIdOnly = await prisma.markdown.findMany({ select: { id: true } })
     * 
    **/
    findMany<T extends MarkdownFindManyArgs>(
      args?: SelectSubset<T, MarkdownFindManyArgs>
    ): CheckSelect<T, PrismaPromise<Array<Markdown>>, PrismaPromise<Array<MarkdownGetPayload<T>>>>

    /**
     * Create a Markdown.
     * @param {MarkdownCreateArgs} args - Arguments to create a Markdown.
     * @example
     * // Create one Markdown
     * const Markdown = await prisma.markdown.create({
     *   data: {
     *     // ... data to create a Markdown
     *   }
     * })
     * 
    **/
    create<T extends MarkdownCreateArgs>(
      args: SelectSubset<T, MarkdownCreateArgs>
    ): CheckSelect<T, Prisma__MarkdownClient<Markdown>, Prisma__MarkdownClient<MarkdownGetPayload<T>>>

    /**
     * Delete a Markdown.
     * @param {MarkdownDeleteArgs} args - Arguments to delete one Markdown.
     * @example
     * // Delete one Markdown
     * const Markdown = await prisma.markdown.delete({
     *   where: {
     *     // ... filter to delete one Markdown
     *   }
     * })
     * 
    **/
    delete<T extends MarkdownDeleteArgs>(
      args: SelectSubset<T, MarkdownDeleteArgs>
    ): CheckSelect<T, Prisma__MarkdownClient<Markdown>, Prisma__MarkdownClient<MarkdownGetPayload<T>>>

    /**
     * Update one Markdown.
     * @param {MarkdownUpdateArgs} args - Arguments to update one Markdown.
     * @example
     * // Update one Markdown
     * const markdown = await prisma.markdown.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
    **/
    update<T extends MarkdownUpdateArgs>(
      args: SelectSubset<T, MarkdownUpdateArgs>
    ): CheckSelect<T, Prisma__MarkdownClient<Markdown>, Prisma__MarkdownClient<MarkdownGetPayload<T>>>

    /**
     * Delete zero or more Markdowns.
     * @param {MarkdownDeleteManyArgs} args - Arguments to filter Markdowns to delete.
     * @example
     * // Delete a few Markdowns
     * const { count } = await prisma.markdown.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
    **/
    deleteMany<T extends MarkdownDeleteManyArgs>(
      args?: SelectSubset<T, MarkdownDeleteManyArgs>
    ): PrismaPromise<BatchPayload>

    /**
     * Update zero or more Markdowns.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {MarkdownUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Markdowns
     * const markdown = await prisma.markdown.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
    **/
    updateMany<T extends MarkdownUpdateManyArgs>(
      args: SelectSubset<T, MarkdownUpdateManyArgs>
    ): PrismaPromise<BatchPayload>

    /**
     * Create or update one Markdown.
     * @param {MarkdownUpsertArgs} args - Arguments to update or create a Markdown.
     * @example
     * // Update or create a Markdown
     * const markdown = await prisma.markdown.upsert({
     *   create: {
     *     // ... data to create a Markdown
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Markdown we want to update
     *   }
     * })
    **/
    upsert<T extends MarkdownUpsertArgs>(
      args: SelectSubset<T, MarkdownUpsertArgs>
    ): CheckSelect<T, Prisma__MarkdownClient<Markdown>, Prisma__MarkdownClient<MarkdownGetPayload<T>>>

    /**
     * Count the number of Markdowns.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {MarkdownCountArgs} args - Arguments to filter Markdowns to count.
     * @example
     * // Count the number of Markdowns
     * const count = await prisma.markdown.count({
     *   where: {
     *     // ... the filter for the Markdowns we want to count
     *   }
     * })
    **/
    count<T extends MarkdownCountArgs>(
      args?: Subset<T, MarkdownCountArgs>,
    ): PrismaPromise<
      T extends _Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], MarkdownCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Markdown.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {MarkdownAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends MarkdownAggregateArgs>(args: Subset<T, MarkdownAggregateArgs>): PrismaPromise<GetMarkdownAggregateType<T>>

    /**
     * Group by Markdown.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {MarkdownGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends MarkdownGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: MarkdownGroupByArgs['orderBy'] }
        : { orderBy?: MarkdownGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends TupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, MarkdownGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetMarkdownGroupByPayload<T> : PrismaPromise<InputErrors>
  }

  /**
   * The delegate class that acts as a "Promise-like" for Markdown.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export class Prisma__MarkdownClient<T> implements PrismaPromise<T> {
    [prisma]: true;
    private readonly _dmmf;
    private readonly _fetcher;
    private readonly _queryType;
    private readonly _rootField;
    private readonly _clientMethod;
    private readonly _args;
    private readonly _dataPath;
    private readonly _errorFormat;
    private readonly _measurePerformance?;
    private _isList;
    private _callsite;
    private _requestPromise?;
    constructor(_dmmf: runtime.DMMFClass, _fetcher: PrismaClientFetcher, _queryType: 'query' | 'mutation', _rootField: string, _clientMethod: string, _args: any, _dataPath: string[], _errorFormat: ErrorFormat, _measurePerformance?: boolean | undefined, _isList?: boolean);
    readonly [Symbol.toStringTag]: 'PrismaClientPromise';


    private get _document();
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): Promise<TResult1 | TResult2>;
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): Promise<T | TResult>;
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): Promise<T>;
  }

  // Custom InputTypes

  /**
   * Markdown findUnique
   */
  export type MarkdownFindUniqueArgs = {
    /**
     * Select specific fields to fetch from the Markdown
     * 
    **/
    select?: MarkdownSelect | null
    /**
     * Throw an Error if a Markdown can't be found
     * 
    **/
    rejectOnNotFound?: RejectOnNotFound
    /**
     * Filter, which Markdown to fetch.
     * 
    **/
    where: MarkdownWhereUniqueInput
  }


  /**
   * Markdown findFirst
   */
  export type MarkdownFindFirstArgs = {
    /**
     * Select specific fields to fetch from the Markdown
     * 
    **/
    select?: MarkdownSelect | null
    /**
     * Throw an Error if a Markdown can't be found
     * 
    **/
    rejectOnNotFound?: RejectOnNotFound
    /**
     * Filter, which Markdown to fetch.
     * 
    **/
    where?: MarkdownWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Markdowns to fetch.
     * 
    **/
    orderBy?: Enumerable<MarkdownOrderByWithRelationInput>
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Markdowns.
     * 
    **/
    cursor?: MarkdownWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Markdowns from the position of the cursor.
     * 
    **/
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Markdowns.
     * 
    **/
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Markdowns.
     * 
    **/
    distinct?: Enumerable<MarkdownScalarFieldEnum>
  }


  /**
   * Markdown findMany
   */
  export type MarkdownFindManyArgs = {
    /**
     * Select specific fields to fetch from the Markdown
     * 
    **/
    select?: MarkdownSelect | null
    /**
     * Filter, which Markdowns to fetch.
     * 
    **/
    where?: MarkdownWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Markdowns to fetch.
     * 
    **/
    orderBy?: Enumerable<MarkdownOrderByWithRelationInput>
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Markdowns.
     * 
    **/
    cursor?: MarkdownWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Markdowns from the position of the cursor.
     * 
    **/
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Markdowns.
     * 
    **/
    skip?: number
    distinct?: Enumerable<MarkdownScalarFieldEnum>
  }


  /**
   * Markdown create
   */
  export type MarkdownCreateArgs = {
    /**
     * Select specific fields to fetch from the Markdown
     * 
    **/
    select?: MarkdownSelect | null
    /**
     * The data needed to create a Markdown.
     * 
    **/
    data: XOR<MarkdownCreateInput, MarkdownUncheckedCreateInput>
  }


  /**
   * Markdown update
   */
  export type MarkdownUpdateArgs = {
    /**
     * Select specific fields to fetch from the Markdown
     * 
    **/
    select?: MarkdownSelect | null
    /**
     * The data needed to update a Markdown.
     * 
    **/
    data: XOR<MarkdownUpdateInput, MarkdownUncheckedUpdateInput>
    /**
     * Choose, which Markdown to update.
     * 
    **/
    where: MarkdownWhereUniqueInput
  }


  /**
   * Markdown updateMany
   */
  export type MarkdownUpdateManyArgs = {
    /**
     * The data used to update Markdowns.
     * 
    **/
    data: XOR<MarkdownUpdateManyMutationInput, MarkdownUncheckedUpdateManyInput>
    /**
     * Filter which Markdowns to update
     * 
    **/
    where?: MarkdownWhereInput
  }


  /**
   * Markdown upsert
   */
  export type MarkdownUpsertArgs = {
    /**
     * Select specific fields to fetch from the Markdown
     * 
    **/
    select?: MarkdownSelect | null
    /**
     * The filter to search for the Markdown to update in case it exists.
     * 
    **/
    where: MarkdownWhereUniqueInput
    /**
     * In case the Markdown found by the `where` argument doesn't exist, create a new Markdown with this data.
     * 
    **/
    create: XOR<MarkdownCreateInput, MarkdownUncheckedCreateInput>
    /**
     * In case the Markdown was found with the provided `where` argument, update it with this data.
     * 
    **/
    update: XOR<MarkdownUpdateInput, MarkdownUncheckedUpdateInput>
  }


  /**
   * Markdown delete
   */
  export type MarkdownDeleteArgs = {
    /**
     * Select specific fields to fetch from the Markdown
     * 
    **/
    select?: MarkdownSelect | null
    /**
     * Filter which Markdown to delete.
     * 
    **/
    where: MarkdownWhereUniqueInput
  }


  /**
   * Markdown deleteMany
   */
  export type MarkdownDeleteManyArgs = {
    /**
     * Filter which Markdowns to delete
     * 
    **/
    where?: MarkdownWhereInput
  }


  /**
   * Markdown without action
   */
  export type MarkdownArgs = {
    /**
     * Select specific fields to fetch from the Markdown
     * 
    **/
    select?: MarkdownSelect | null
  }



  /**
   * Model MarkdownX
   */


  export type AggregateMarkdownX = {
    _count: MarkdownXCountAggregateOutputType | null
    _avg: MarkdownXAvgAggregateOutputType | null
    _sum: MarkdownXSumAggregateOutputType | null
    _min: MarkdownXMinAggregateOutputType | null
    _max: MarkdownXMaxAggregateOutputType | null
  }

  export type MarkdownXAvgAggregateOutputType = {
    id: number | null
  }

  export type MarkdownXSumAggregateOutputType = {
    id: number | null
  }

  export type MarkdownXMinAggregateOutputType = {
    id: number | null
    createdAt: Date | null
    modifiedAt: Date | null
    content: string | null
  }

  export type MarkdownXMaxAggregateOutputType = {
    id: number | null
    createdAt: Date | null
    modifiedAt: Date | null
    content: string | null
  }

  export type MarkdownXCountAggregateOutputType = {
    id: number
    createdAt: number
    modifiedAt: number
    content: number
    _all: number
  }


  export type MarkdownXAvgAggregateInputType = {
    id?: true
  }

  export type MarkdownXSumAggregateInputType = {
    id?: true
  }

  export type MarkdownXMinAggregateInputType = {
    id?: true
    createdAt?: true
    modifiedAt?: true
    content?: true
  }

  export type MarkdownXMaxAggregateInputType = {
    id?: true
    createdAt?: true
    modifiedAt?: true
    content?: true
  }

  export type MarkdownXCountAggregateInputType = {
    id?: true
    createdAt?: true
    modifiedAt?: true
    content?: true
    _all?: true
  }

  export type MarkdownXAggregateArgs = {
    /**
     * Filter which MarkdownX to aggregate.
     * 
    **/
    where?: MarkdownXWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of MarkdownXES to fetch.
     * 
    **/
    orderBy?: Enumerable<MarkdownXOrderByWithRelationInput>
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     * 
    **/
    cursor?: MarkdownXWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` MarkdownXES from the position of the cursor.
     * 
    **/
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` MarkdownXES.
     * 
    **/
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned MarkdownXES
    **/
    _count?: true | MarkdownXCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: MarkdownXAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: MarkdownXSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: MarkdownXMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: MarkdownXMaxAggregateInputType
  }

  export type GetMarkdownXAggregateType<T extends MarkdownXAggregateArgs> = {
        [P in keyof T & keyof AggregateMarkdownX]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateMarkdownX[P]>
      : GetScalarType<T[P], AggregateMarkdownX[P]>
  }




  export type MarkdownXGroupByArgs = {
    where?: MarkdownXWhereInput
    orderBy?: Enumerable<MarkdownXOrderByWithAggregationInput>
    by: Array<MarkdownXScalarFieldEnum>
    having?: MarkdownXScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: MarkdownXCountAggregateInputType | true
    _avg?: MarkdownXAvgAggregateInputType
    _sum?: MarkdownXSumAggregateInputType
    _min?: MarkdownXMinAggregateInputType
    _max?: MarkdownXMaxAggregateInputType
  }


  export type MarkdownXGroupByOutputType = {
    id: number
    createdAt: Date
    modifiedAt: Date
    content: string
    _count: MarkdownXCountAggregateOutputType | null
    _avg: MarkdownXAvgAggregateOutputType | null
    _sum: MarkdownXSumAggregateOutputType | null
    _min: MarkdownXMinAggregateOutputType | null
    _max: MarkdownXMaxAggregateOutputType | null
  }

  type GetMarkdownXGroupByPayload<T extends MarkdownXGroupByArgs> = PrismaPromise<
    Array<
      PickArray<MarkdownXGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof MarkdownXGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], MarkdownXGroupByOutputType[P]>
            : GetScalarType<T[P], MarkdownXGroupByOutputType[P]>
        }
      >
    >


  export type MarkdownXSelect = {
    id?: boolean
    createdAt?: boolean
    modifiedAt?: boolean
    content?: boolean
  }

  export type MarkdownXGetPayload<
    S extends boolean | null | undefined | MarkdownXArgs,
    U = keyof S
      > = S extends true
        ? MarkdownX
    : S extends undefined
    ? never
    : S extends MarkdownXArgs | MarkdownXFindManyArgs
    ?'include' extends U
    ? MarkdownX 
    : 'select' extends U
    ? {
    [P in TrueKeys<S['select']>]:
    P extends keyof MarkdownX ? MarkdownX[P] : never
  } 
    : MarkdownX
  : MarkdownX


  type MarkdownXCountArgs = Merge<
    Omit<MarkdownXFindManyArgs, 'select' | 'include'> & {
      select?: MarkdownXCountAggregateInputType | true
    }
  >

  export interface MarkdownXDelegate<GlobalRejectSettings> {
    /**
     * Find zero or one MarkdownX that matches the filter.
     * @param {MarkdownXFindUniqueArgs} args - Arguments to find a MarkdownX
     * @example
     * // Get one MarkdownX
     * const markdownX = await prisma.markdownX.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
    **/
    findUnique<T extends MarkdownXFindUniqueArgs,  LocalRejectSettings = T["rejectOnNotFound"] extends RejectOnNotFound ? T['rejectOnNotFound'] : undefined>(
      args: SelectSubset<T, MarkdownXFindUniqueArgs>
    ): HasReject<GlobalRejectSettings, LocalRejectSettings, 'findUnique', 'MarkdownX'> extends True ? CheckSelect<T, Prisma__MarkdownXClient<MarkdownX>, Prisma__MarkdownXClient<MarkdownXGetPayload<T>>> : CheckSelect<T, Prisma__MarkdownXClient<MarkdownX | null >, Prisma__MarkdownXClient<MarkdownXGetPayload<T> | null >>

    /**
     * Find the first MarkdownX that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {MarkdownXFindFirstArgs} args - Arguments to find a MarkdownX
     * @example
     * // Get one MarkdownX
     * const markdownX = await prisma.markdownX.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
    **/
    findFirst<T extends MarkdownXFindFirstArgs,  LocalRejectSettings = T["rejectOnNotFound"] extends RejectOnNotFound ? T['rejectOnNotFound'] : undefined>(
      args?: SelectSubset<T, MarkdownXFindFirstArgs>
    ): HasReject<GlobalRejectSettings, LocalRejectSettings, 'findFirst', 'MarkdownX'> extends True ? CheckSelect<T, Prisma__MarkdownXClient<MarkdownX>, Prisma__MarkdownXClient<MarkdownXGetPayload<T>>> : CheckSelect<T, Prisma__MarkdownXClient<MarkdownX | null >, Prisma__MarkdownXClient<MarkdownXGetPayload<T> | null >>

    /**
     * Find zero or more MarkdownXES that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {MarkdownXFindManyArgs=} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all MarkdownXES
     * const markdownXES = await prisma.markdownX.findMany()
     * 
     * // Get first 10 MarkdownXES
     * const markdownXES = await prisma.markdownX.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const markdownXWithIdOnly = await prisma.markdownX.findMany({ select: { id: true } })
     * 
    **/
    findMany<T extends MarkdownXFindManyArgs>(
      args?: SelectSubset<T, MarkdownXFindManyArgs>
    ): CheckSelect<T, PrismaPromise<Array<MarkdownX>>, PrismaPromise<Array<MarkdownXGetPayload<T>>>>

    /**
     * Create a MarkdownX.
     * @param {MarkdownXCreateArgs} args - Arguments to create a MarkdownX.
     * @example
     * // Create one MarkdownX
     * const MarkdownX = await prisma.markdownX.create({
     *   data: {
     *     // ... data to create a MarkdownX
     *   }
     * })
     * 
    **/
    create<T extends MarkdownXCreateArgs>(
      args: SelectSubset<T, MarkdownXCreateArgs>
    ): CheckSelect<T, Prisma__MarkdownXClient<MarkdownX>, Prisma__MarkdownXClient<MarkdownXGetPayload<T>>>

    /**
     * Delete a MarkdownX.
     * @param {MarkdownXDeleteArgs} args - Arguments to delete one MarkdownX.
     * @example
     * // Delete one MarkdownX
     * const MarkdownX = await prisma.markdownX.delete({
     *   where: {
     *     // ... filter to delete one MarkdownX
     *   }
     * })
     * 
    **/
    delete<T extends MarkdownXDeleteArgs>(
      args: SelectSubset<T, MarkdownXDeleteArgs>
    ): CheckSelect<T, Prisma__MarkdownXClient<MarkdownX>, Prisma__MarkdownXClient<MarkdownXGetPayload<T>>>

    /**
     * Update one MarkdownX.
     * @param {MarkdownXUpdateArgs} args - Arguments to update one MarkdownX.
     * @example
     * // Update one MarkdownX
     * const markdownX = await prisma.markdownX.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
    **/
    update<T extends MarkdownXUpdateArgs>(
      args: SelectSubset<T, MarkdownXUpdateArgs>
    ): CheckSelect<T, Prisma__MarkdownXClient<MarkdownX>, Prisma__MarkdownXClient<MarkdownXGetPayload<T>>>

    /**
     * Delete zero or more MarkdownXES.
     * @param {MarkdownXDeleteManyArgs} args - Arguments to filter MarkdownXES to delete.
     * @example
     * // Delete a few MarkdownXES
     * const { count } = await prisma.markdownX.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
    **/
    deleteMany<T extends MarkdownXDeleteManyArgs>(
      args?: SelectSubset<T, MarkdownXDeleteManyArgs>
    ): PrismaPromise<BatchPayload>

    /**
     * Update zero or more MarkdownXES.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {MarkdownXUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many MarkdownXES
     * const markdownX = await prisma.markdownX.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
    **/
    updateMany<T extends MarkdownXUpdateManyArgs>(
      args: SelectSubset<T, MarkdownXUpdateManyArgs>
    ): PrismaPromise<BatchPayload>

    /**
     * Create or update one MarkdownX.
     * @param {MarkdownXUpsertArgs} args - Arguments to update or create a MarkdownX.
     * @example
     * // Update or create a MarkdownX
     * const markdownX = await prisma.markdownX.upsert({
     *   create: {
     *     // ... data to create a MarkdownX
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the MarkdownX we want to update
     *   }
     * })
    **/
    upsert<T extends MarkdownXUpsertArgs>(
      args: SelectSubset<T, MarkdownXUpsertArgs>
    ): CheckSelect<T, Prisma__MarkdownXClient<MarkdownX>, Prisma__MarkdownXClient<MarkdownXGetPayload<T>>>

    /**
     * Count the number of MarkdownXES.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {MarkdownXCountArgs} args - Arguments to filter MarkdownXES to count.
     * @example
     * // Count the number of MarkdownXES
     * const count = await prisma.markdownX.count({
     *   where: {
     *     // ... the filter for the MarkdownXES we want to count
     *   }
     * })
    **/
    count<T extends MarkdownXCountArgs>(
      args?: Subset<T, MarkdownXCountArgs>,
    ): PrismaPromise<
      T extends _Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], MarkdownXCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a MarkdownX.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {MarkdownXAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends MarkdownXAggregateArgs>(args: Subset<T, MarkdownXAggregateArgs>): PrismaPromise<GetMarkdownXAggregateType<T>>

    /**
     * Group by MarkdownX.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {MarkdownXGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends MarkdownXGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: MarkdownXGroupByArgs['orderBy'] }
        : { orderBy?: MarkdownXGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends TupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, MarkdownXGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetMarkdownXGroupByPayload<T> : PrismaPromise<InputErrors>
  }

  /**
   * The delegate class that acts as a "Promise-like" for MarkdownX.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export class Prisma__MarkdownXClient<T> implements PrismaPromise<T> {
    [prisma]: true;
    private readonly _dmmf;
    private readonly _fetcher;
    private readonly _queryType;
    private readonly _rootField;
    private readonly _clientMethod;
    private readonly _args;
    private readonly _dataPath;
    private readonly _errorFormat;
    private readonly _measurePerformance?;
    private _isList;
    private _callsite;
    private _requestPromise?;
    constructor(_dmmf: runtime.DMMFClass, _fetcher: PrismaClientFetcher, _queryType: 'query' | 'mutation', _rootField: string, _clientMethod: string, _args: any, _dataPath: string[], _errorFormat: ErrorFormat, _measurePerformance?: boolean | undefined, _isList?: boolean);
    readonly [Symbol.toStringTag]: 'PrismaClientPromise';


    private get _document();
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): Promise<TResult1 | TResult2>;
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): Promise<T | TResult>;
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): Promise<T>;
  }

  // Custom InputTypes

  /**
   * MarkdownX findUnique
   */
  export type MarkdownXFindUniqueArgs = {
    /**
     * Select specific fields to fetch from the MarkdownX
     * 
    **/
    select?: MarkdownXSelect | null
    /**
     * Throw an Error if a MarkdownX can't be found
     * 
    **/
    rejectOnNotFound?: RejectOnNotFound
    /**
     * Filter, which MarkdownX to fetch.
     * 
    **/
    where: MarkdownXWhereUniqueInput
  }


  /**
   * MarkdownX findFirst
   */
  export type MarkdownXFindFirstArgs = {
    /**
     * Select specific fields to fetch from the MarkdownX
     * 
    **/
    select?: MarkdownXSelect | null
    /**
     * Throw an Error if a MarkdownX can't be found
     * 
    **/
    rejectOnNotFound?: RejectOnNotFound
    /**
     * Filter, which MarkdownX to fetch.
     * 
    **/
    where?: MarkdownXWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of MarkdownXES to fetch.
     * 
    **/
    orderBy?: Enumerable<MarkdownXOrderByWithRelationInput>
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for MarkdownXES.
     * 
    **/
    cursor?: MarkdownXWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` MarkdownXES from the position of the cursor.
     * 
    **/
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` MarkdownXES.
     * 
    **/
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of MarkdownXES.
     * 
    **/
    distinct?: Enumerable<MarkdownXScalarFieldEnum>
  }


  /**
   * MarkdownX findMany
   */
  export type MarkdownXFindManyArgs = {
    /**
     * Select specific fields to fetch from the MarkdownX
     * 
    **/
    select?: MarkdownXSelect | null
    /**
     * Filter, which MarkdownXES to fetch.
     * 
    **/
    where?: MarkdownXWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of MarkdownXES to fetch.
     * 
    **/
    orderBy?: Enumerable<MarkdownXOrderByWithRelationInput>
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing MarkdownXES.
     * 
    **/
    cursor?: MarkdownXWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` MarkdownXES from the position of the cursor.
     * 
    **/
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` MarkdownXES.
     * 
    **/
    skip?: number
    distinct?: Enumerable<MarkdownXScalarFieldEnum>
  }


  /**
   * MarkdownX create
   */
  export type MarkdownXCreateArgs = {
    /**
     * Select specific fields to fetch from the MarkdownX
     * 
    **/
    select?: MarkdownXSelect | null
    /**
     * The data needed to create a MarkdownX.
     * 
    **/
    data: XOR<MarkdownXCreateInput, MarkdownXUncheckedCreateInput>
  }


  /**
   * MarkdownX update
   */
  export type MarkdownXUpdateArgs = {
    /**
     * Select specific fields to fetch from the MarkdownX
     * 
    **/
    select?: MarkdownXSelect | null
    /**
     * The data needed to update a MarkdownX.
     * 
    **/
    data: XOR<MarkdownXUpdateInput, MarkdownXUncheckedUpdateInput>
    /**
     * Choose, which MarkdownX to update.
     * 
    **/
    where: MarkdownXWhereUniqueInput
  }


  /**
   * MarkdownX updateMany
   */
  export type MarkdownXUpdateManyArgs = {
    /**
     * The data used to update MarkdownXES.
     * 
    **/
    data: XOR<MarkdownXUpdateManyMutationInput, MarkdownXUncheckedUpdateManyInput>
    /**
     * Filter which MarkdownXES to update
     * 
    **/
    where?: MarkdownXWhereInput
  }


  /**
   * MarkdownX upsert
   */
  export type MarkdownXUpsertArgs = {
    /**
     * Select specific fields to fetch from the MarkdownX
     * 
    **/
    select?: MarkdownXSelect | null
    /**
     * The filter to search for the MarkdownX to update in case it exists.
     * 
    **/
    where: MarkdownXWhereUniqueInput
    /**
     * In case the MarkdownX found by the `where` argument doesn't exist, create a new MarkdownX with this data.
     * 
    **/
    create: XOR<MarkdownXCreateInput, MarkdownXUncheckedCreateInput>
    /**
     * In case the MarkdownX was found with the provided `where` argument, update it with this data.
     * 
    **/
    update: XOR<MarkdownXUpdateInput, MarkdownXUncheckedUpdateInput>
  }


  /**
   * MarkdownX delete
   */
  export type MarkdownXDeleteArgs = {
    /**
     * Select specific fields to fetch from the MarkdownX
     * 
    **/
    select?: MarkdownXSelect | null
    /**
     * Filter which MarkdownX to delete.
     * 
    **/
    where: MarkdownXWhereUniqueInput
  }


  /**
   * MarkdownX deleteMany
   */
  export type MarkdownXDeleteManyArgs = {
    /**
     * Filter which MarkdownXES to delete
     * 
    **/
    where?: MarkdownXWhereInput
  }


  /**
   * MarkdownX without action
   */
  export type MarkdownXArgs = {
    /**
     * Select specific fields to fetch from the MarkdownX
     * 
    **/
    select?: MarkdownXSelect | null
  }



  /**
   * Enums
   */

  // Based on
  // https://github.com/microsoft/TypeScript/issues/3192#issuecomment-261720275

  export const MarkdownScalarFieldEnum: {
    id: 'id',
    createdAt: 'createdAt',
    modifiedAt: 'modifiedAt',
    content: 'content'
  };

  export type MarkdownScalarFieldEnum = (typeof MarkdownScalarFieldEnum)[keyof typeof MarkdownScalarFieldEnum]


  export const MarkdownXScalarFieldEnum: {
    id: 'id',
    createdAt: 'createdAt',
    modifiedAt: 'modifiedAt',
    content: 'content'
  };

  export type MarkdownXScalarFieldEnum = (typeof MarkdownXScalarFieldEnum)[keyof typeof MarkdownXScalarFieldEnum]


  export const SortOrder: {
    asc: 'asc',
    desc: 'desc'
  };

  export type SortOrder = (typeof SortOrder)[keyof typeof SortOrder]


  /**
   * Deep Input Types
   */


  export type MarkdownWhereInput = {
    AND?: Enumerable<MarkdownWhereInput>
    OR?: Enumerable<MarkdownWhereInput>
    NOT?: Enumerable<MarkdownWhereInput>
    id?: IntFilter | number
    createdAt?: DateTimeFilter | Date | string
    modifiedAt?: DateTimeFilter | Date | string
    content?: StringFilter | string
  }

  export type MarkdownOrderByWithRelationInput = {
    id?: SortOrder
    createdAt?: SortOrder
    modifiedAt?: SortOrder
    content?: SortOrder
  }

  export type MarkdownWhereUniqueInput = {
    id?: number
  }

  export type MarkdownOrderByWithAggregationInput = {
    id?: SortOrder
    createdAt?: SortOrder
    modifiedAt?: SortOrder
    content?: SortOrder
    _count?: MarkdownCountOrderByAggregateInput
    _avg?: MarkdownAvgOrderByAggregateInput
    _max?: MarkdownMaxOrderByAggregateInput
    _min?: MarkdownMinOrderByAggregateInput
    _sum?: MarkdownSumOrderByAggregateInput
  }

  export type MarkdownScalarWhereWithAggregatesInput = {
    AND?: Enumerable<MarkdownScalarWhereWithAggregatesInput>
    OR?: Enumerable<MarkdownScalarWhereWithAggregatesInput>
    NOT?: Enumerable<MarkdownScalarWhereWithAggregatesInput>
    id?: IntWithAggregatesFilter | number
    createdAt?: DateTimeWithAggregatesFilter | Date | string
    modifiedAt?: DateTimeWithAggregatesFilter | Date | string
    content?: StringWithAggregatesFilter | string
  }

  export type MarkdownXWhereInput = {
    AND?: Enumerable<MarkdownXWhereInput>
    OR?: Enumerable<MarkdownXWhereInput>
    NOT?: Enumerable<MarkdownXWhereInput>
    id?: IntFilter | number
    createdAt?: DateTimeFilter | Date | string
    modifiedAt?: DateTimeFilter | Date | string
    content?: StringFilter | string
  }

  export type MarkdownXOrderByWithRelationInput = {
    id?: SortOrder
    createdAt?: SortOrder
    modifiedAt?: SortOrder
    content?: SortOrder
  }

  export type MarkdownXWhereUniqueInput = {
    id?: number
  }

  export type MarkdownXOrderByWithAggregationInput = {
    id?: SortOrder
    createdAt?: SortOrder
    modifiedAt?: SortOrder
    content?: SortOrder
    _count?: MarkdownXCountOrderByAggregateInput
    _avg?: MarkdownXAvgOrderByAggregateInput
    _max?: MarkdownXMaxOrderByAggregateInput
    _min?: MarkdownXMinOrderByAggregateInput
    _sum?: MarkdownXSumOrderByAggregateInput
  }

  export type MarkdownXScalarWhereWithAggregatesInput = {
    AND?: Enumerable<MarkdownXScalarWhereWithAggregatesInput>
    OR?: Enumerable<MarkdownXScalarWhereWithAggregatesInput>
    NOT?: Enumerable<MarkdownXScalarWhereWithAggregatesInput>
    id?: IntWithAggregatesFilter | number
    createdAt?: DateTimeWithAggregatesFilter | Date | string
    modifiedAt?: DateTimeWithAggregatesFilter | Date | string
    content?: StringWithAggregatesFilter | string
  }

  export type MarkdownCreateInput = {
    createdAt?: Date | string
    modifiedAt?: Date | string
    content: string
  }

  export type MarkdownUncheckedCreateInput = {
    id?: number
    createdAt?: Date | string
    modifiedAt?: Date | string
    content: string
  }

  export type MarkdownUpdateInput = {
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    modifiedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    content?: StringFieldUpdateOperationsInput | string
  }

  export type MarkdownUncheckedUpdateInput = {
    id?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    modifiedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    content?: StringFieldUpdateOperationsInput | string
  }

  export type MarkdownUpdateManyMutationInput = {
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    modifiedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    content?: StringFieldUpdateOperationsInput | string
  }

  export type MarkdownUncheckedUpdateManyInput = {
    id?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    modifiedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    content?: StringFieldUpdateOperationsInput | string
  }

  export type MarkdownXCreateInput = {
    createdAt?: Date | string
    modifiedAt?: Date | string
    content: string
  }

  export type MarkdownXUncheckedCreateInput = {
    id?: number
    createdAt?: Date | string
    modifiedAt?: Date | string
    content: string
  }

  export type MarkdownXUpdateInput = {
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    modifiedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    content?: StringFieldUpdateOperationsInput | string
  }

  export type MarkdownXUncheckedUpdateInput = {
    id?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    modifiedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    content?: StringFieldUpdateOperationsInput | string
  }

  export type MarkdownXUpdateManyMutationInput = {
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    modifiedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    content?: StringFieldUpdateOperationsInput | string
  }

  export type MarkdownXUncheckedUpdateManyInput = {
    id?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    modifiedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    content?: StringFieldUpdateOperationsInput | string
  }

  export type IntFilter = {
    equals?: number
    in?: Enumerable<number>
    notIn?: Enumerable<number>
    lt?: number
    lte?: number
    gt?: number
    gte?: number
    not?: NestedIntFilter | number
  }

  export type DateTimeFilter = {
    equals?: Date | string
    in?: Enumerable<Date> | Enumerable<string>
    notIn?: Enumerable<Date> | Enumerable<string>
    lt?: Date | string
    lte?: Date | string
    gt?: Date | string
    gte?: Date | string
    not?: NestedDateTimeFilter | Date | string
  }

  export type StringFilter = {
    equals?: string
    in?: Enumerable<string>
    notIn?: Enumerable<string>
    lt?: string
    lte?: string
    gt?: string
    gte?: string
    contains?: string
    startsWith?: string
    endsWith?: string
    not?: NestedStringFilter | string
  }

  export type MarkdownCountOrderByAggregateInput = {
    id?: SortOrder
    createdAt?: SortOrder
    modifiedAt?: SortOrder
    content?: SortOrder
  }

  export type MarkdownAvgOrderByAggregateInput = {
    id?: SortOrder
  }

  export type MarkdownMaxOrderByAggregateInput = {
    id?: SortOrder
    createdAt?: SortOrder
    modifiedAt?: SortOrder
    content?: SortOrder
  }

  export type MarkdownMinOrderByAggregateInput = {
    id?: SortOrder
    createdAt?: SortOrder
    modifiedAt?: SortOrder
    content?: SortOrder
  }

  export type MarkdownSumOrderByAggregateInput = {
    id?: SortOrder
  }

  export type IntWithAggregatesFilter = {
    equals?: number
    in?: Enumerable<number>
    notIn?: Enumerable<number>
    lt?: number
    lte?: number
    gt?: number
    gte?: number
    not?: NestedIntWithAggregatesFilter | number
    _count?: NestedIntFilter
    _avg?: NestedFloatFilter
    _sum?: NestedIntFilter
    _min?: NestedIntFilter
    _max?: NestedIntFilter
  }

  export type DateTimeWithAggregatesFilter = {
    equals?: Date | string
    in?: Enumerable<Date> | Enumerable<string>
    notIn?: Enumerable<Date> | Enumerable<string>
    lt?: Date | string
    lte?: Date | string
    gt?: Date | string
    gte?: Date | string
    not?: NestedDateTimeWithAggregatesFilter | Date | string
    _count?: NestedIntFilter
    _min?: NestedDateTimeFilter
    _max?: NestedDateTimeFilter
  }

  export type StringWithAggregatesFilter = {
    equals?: string
    in?: Enumerable<string>
    notIn?: Enumerable<string>
    lt?: string
    lte?: string
    gt?: string
    gte?: string
    contains?: string
    startsWith?: string
    endsWith?: string
    not?: NestedStringWithAggregatesFilter | string
    _count?: NestedIntFilter
    _min?: NestedStringFilter
    _max?: NestedStringFilter
  }

  export type MarkdownXCountOrderByAggregateInput = {
    id?: SortOrder
    createdAt?: SortOrder
    modifiedAt?: SortOrder
    content?: SortOrder
  }

  export type MarkdownXAvgOrderByAggregateInput = {
    id?: SortOrder
  }

  export type MarkdownXMaxOrderByAggregateInput = {
    id?: SortOrder
    createdAt?: SortOrder
    modifiedAt?: SortOrder
    content?: SortOrder
  }

  export type MarkdownXMinOrderByAggregateInput = {
    id?: SortOrder
    createdAt?: SortOrder
    modifiedAt?: SortOrder
    content?: SortOrder
  }

  export type MarkdownXSumOrderByAggregateInput = {
    id?: SortOrder
  }

  export type DateTimeFieldUpdateOperationsInput = {
    set?: Date | string
  }

  export type StringFieldUpdateOperationsInput = {
    set?: string
  }

  export type IntFieldUpdateOperationsInput = {
    set?: number
    increment?: number
    decrement?: number
    multiply?: number
    divide?: number
  }

  export type NestedIntFilter = {
    equals?: number
    in?: Enumerable<number>
    notIn?: Enumerable<number>
    lt?: number
    lte?: number
    gt?: number
    gte?: number
    not?: NestedIntFilter | number
  }

  export type NestedDateTimeFilter = {
    equals?: Date | string
    in?: Enumerable<Date> | Enumerable<string>
    notIn?: Enumerable<Date> | Enumerable<string>
    lt?: Date | string
    lte?: Date | string
    gt?: Date | string
    gte?: Date | string
    not?: NestedDateTimeFilter | Date | string
  }

  export type NestedStringFilter = {
    equals?: string
    in?: Enumerable<string>
    notIn?: Enumerable<string>
    lt?: string
    lte?: string
    gt?: string
    gte?: string
    contains?: string
    startsWith?: string
    endsWith?: string
    not?: NestedStringFilter | string
  }

  export type NestedIntWithAggregatesFilter = {
    equals?: number
    in?: Enumerable<number>
    notIn?: Enumerable<number>
    lt?: number
    lte?: number
    gt?: number
    gte?: number
    not?: NestedIntWithAggregatesFilter | number
    _count?: NestedIntFilter
    _avg?: NestedFloatFilter
    _sum?: NestedIntFilter
    _min?: NestedIntFilter
    _max?: NestedIntFilter
  }

  export type NestedFloatFilter = {
    equals?: number
    in?: Enumerable<number>
    notIn?: Enumerable<number>
    lt?: number
    lte?: number
    gt?: number
    gte?: number
    not?: NestedFloatFilter | number
  }

  export type NestedDateTimeWithAggregatesFilter = {
    equals?: Date | string
    in?: Enumerable<Date> | Enumerable<string>
    notIn?: Enumerable<Date> | Enumerable<string>
    lt?: Date | string
    lte?: Date | string
    gt?: Date | string
    gte?: Date | string
    not?: NestedDateTimeWithAggregatesFilter | Date | string
    _count?: NestedIntFilter
    _min?: NestedDateTimeFilter
    _max?: NestedDateTimeFilter
  }

  export type NestedStringWithAggregatesFilter = {
    equals?: string
    in?: Enumerable<string>
    notIn?: Enumerable<string>
    lt?: string
    lte?: string
    gt?: string
    gte?: string
    contains?: string
    startsWith?: string
    endsWith?: string
    not?: NestedStringWithAggregatesFilter | string
    _count?: NestedIntFilter
    _min?: NestedStringFilter
    _max?: NestedStringFilter
  }



  /**
   * Batch Payload for updateMany & deleteMany & createMany
   */

  export type BatchPayload = {
    count: number
  }

  /**
   * DMMF
   */
  export const dmmf: runtime.DMMF.Document;
}