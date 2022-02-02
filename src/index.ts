import { pipe } from "./pipe"
import * as fs from "fs/promises"
import * as util from "util"

export namespace Sync {
    export class Sync<A> {
        constructor(readonly thunk: () => A) { }
    }

    export function fromThunk<A>(thunk: () => A) {
        return new Sync(() => thunk())
    }

    export function of<A>(value: A) {
        return fromThunk(() => value)
    }

    export function map<A, B>(f: (a: A) => B) {
        return (self: Sync<A>) => fromThunk(() => f(unsafeRun(self)))
    }

    export function flatMap<A, B>(f: (a: A) => Sync<B>) {
        return (self: Sync<A>) => fromThunk(() => unsafeRun(f(unsafeRun(self))))
    }

    export function unsafeRun<A>(sync: Sync<A>) {
        return sync.thunk()
    }
}

export namespace SyncSafe {
    export abstract class Sync<A> {
        readonly _A!: () => A
    }

    class FromThunk<A> extends Sync<A> {
        constructor(readonly thunk: () => A) {
            super()
        }
    }

    class SyncFlatMap<A, B> extends Sync<B> {
        constructor(readonly self: Sync<A>, readonly f: (a: A) => Sync<B>) {
            super()
        }
    }

    export function fromThunk<A>(thunk: () => A): Sync<A> {
        return new FromThunk(thunk)
    }

    export function of<A>(value: A) {
        return fromThunk(() => value)
    }

    export function map<A, B>(f: (a: A) => B) {
        return (self: Sync<A>): Sync<B> =>
            pipe(self, flatMap((a) => of(f(a))))
    }

    export function flatMap<A, B>(f: (a: A) => Sync<B>) {
        return (self: Sync<A>): Sync<B> =>
            new SyncFlatMap(self, f)
    }

    export function forever<A>(self: Sync<A>): Sync<never> {
        return pipe(self, flatMap(() => forever(self)))
    }

    export function unsafeRun<A>(self: Sync<A>): A {
        type Continuation = (a: unknown) => Sync<unknown>
        const stack: Continuation[] = []
        let currentOperation: Sync<unknown> | undefined = self
        let currentResult = null

        while(currentOperation) {
            if (currentOperation instanceof FromThunk) {
                currentResult = currentOperation.thunk()
                currentOperation = stack.pop()?.(currentResult)
            }
            else if (currentOperation instanceof SyncFlatMap) {
                stack.push(currentOperation.f)
                currentOperation = currentOperation.self
            }
        }

        return currentResult
    }
}

export namespace Async {
    export class Async<A> {
        constructor(readonly thunk: () => Promise<A>) { }
    }

    export function fromThunk<A>(thunk: () => A) {
        return new Async(() => Promise.resolve(thunk()))
    }

    export function fromAsync<A>(thunk: () => Promise<A>) {
        return new Async(thunk)
    }

    export function of<A>(value: A) {
        return fromThunk(() => value)
    }

    export function map<A, B>(f: (a: A) => B) {
        return (self: Async<A>) => fromAsync(() => self.thunk().then((a) => f(a)))
    }

    export function flatMap<A, B>(f: (a: A) => Async<B>) {
        return (self: Async<A>) => fromAsync(() => unsafeRun(self).then((a) => unsafeRun(f(a))))
    }

    export function fromSync<A>(sync: Sync.Sync<A>) {
        return fromThunk(() => sync.thunk())
    }

    export function repeat(n: number) {
        return <A>(self: Async<A>) => fromAsync(async () => {
            const results: A[] = []
            for (let i = 0; i < n; i++) {
                results.push(await self.thunk())
            }
            return results
        })
    }

    export function delay(ms: number) {
        return <A>(self: Async<A>) => fromAsync(async () => {
            await new Promise((res) => {
                setTimeout(() => {
                    res(void 0)
                }, ms)
            })
            return await self.thunk()
        })
    }

    export function forever<A>(self: Async<A>): Async<never> {
        return fromAsync(async () => {
            while (1) {
                await self.thunk()
            }
            throw new Error("unreachable")
        })
    }

    export function unsafeRun<A>(self: Async<A>): Promise<A> {
        return self.thunk()
    }
}

//const logMessage = (message: string) => Async.fromThunk(() => {
//    console.log(message)
//})
//
//const program = pipe(
//    Async.fromAsync(() => fs.readFile("./package.json")),
//    Async.map((buffer) => buffer.toString("utf-8")),
//    Async.flatMap((content) => logMessage("Content of package.json:" + content)),
//    Async.repeat(5),
//    Async.delay(5000),
//    Async.forever
//)

//Async.unsafeRun(program)

const realProgram = pipe(
    SyncSafe.of(0),
    SyncSafe.map((a) => a + 1),
    SyncSafe.map((a) => a + 1),
    SyncSafe.map((a) => a + 1),
    SyncSafe.flatMap((a) => {
        return SyncSafe.fromThunk(() => console.log("result: " + a))
    })
)

SyncSafe.unsafeRun(
 realProgram   
)