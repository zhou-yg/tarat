import { CurrentRunnerScope, IHookContext, Runner, Driver, EScopeState } from 'tarat/core';
export { Driver } from 'tarat/core';
import React from 'react';

declare const DriverContext: React.Context<RenderDriver>;
declare function renderWithDriverContext(e: React.ReactElement, d: RenderDriver): {
    cancelAdaptor: () => void;
    root: React.FunctionComponentElement<React.ProviderProps<RenderDriver>>;
};
declare class RenderDriver {
    mode?: 'collect' | 'consume';
    beleiveContext: boolean;
    updateCallbackSync: boolean;
    BMValuesMap: Map<string, CurrentRunnerScope<any>[]>;
    pushListener?: (scope: CurrentRunnerScope<any>) => void;
    consumeCache: Map<string, IHookContext[] | undefined>;
    fromContextMap(contextMap: Record<string, IHookContext[]>): void;
    switchToServerConsumeMode(): void;
    switchToClientConsumeMode(): void;
    pop(name: string): CurrentRunnerScope<any>;
    getContext(name: string): IHookContext[];
    onPush(f: (scope: CurrentRunnerScope<any>) => void): void;
    push(scope: CurrentRunnerScope<any>, name: string): number;
}

declare global {
    var hookContextMap: {
        [k: string]: IHookContext[];
    };
    var runner: Runner<any>;
    var dc: any;
    var driverWeakMap: Map<Driver, ArgResultMap>;
}
declare type ArgResultMap = Map<string, any>;
interface IProgress {
    state: EScopeState;
}

declare function setHookAdaptor(runtime: any, type: 'react' | 'axii'): () => void;
declare type HasParamFunc = (...arg: any[]) => any;
declare type NoParamFunc = () => any;
declare function useTarat<T extends NoParamFunc, U extends Parameters<T>>(driver: T): ReturnType<T>;
declare function useTarat<T extends HasParamFunc, U extends Parameters<T>>(driver: T, ...args: U extends [] ? [] : U): ReturnType<T>;
declare function useProgress(driverResult: any): IProgress;
declare const useDriver: typeof useTarat;

declare function clientRuntime(c: {
    framework: any;
    name: 'react' | 'axii';
    modelConfig?: any;
    host?: string;
}): void;

declare function traverse(target: Record<string, any>, callback: (arrPath: string[], value: any) => void, parentKeys?: string[]): void;
declare function stringifyWithUndef(data: object): string;
declare function parseWithUndef(str: string): any;
declare const BINARY_FILE_TYPE_PLACEHOLDER = "@binary:FILE";
declare const BINARY_FILE_KEY_SPLIT_CHAR = ".";
declare function isBinaryType(v: any): boolean;
/**
 * @TODO support more data type: Blob, ArrayBuffer
 */
declare function serializeJSON(obj: Record<string, any>): string | FormData;

export { BINARY_FILE_KEY_SPLIT_CHAR, BINARY_FILE_TYPE_PLACEHOLDER, DriverContext, RenderDriver, clientRuntime, isBinaryType, parseWithUndef, renderWithDriverContext, serializeJSON, setHookAdaptor, stringifyWithUndef, traverse, useDriver, useProgress, useTarat };
