import { pipe } from "./pipe"
import * as fs from "fs/promises"

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
        return (self: Sync<A>) => fromThunk(() => f(self.thunk()))
    }
    
    export function flatMap<A, B>(f: (a: A) => Sync<B>) {
        return (self: Sync<A>) => fromThunk(() => f(self.thunk()).thunk())
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
        return (self: Async<A>) => fromAsync(() => self.thunk().then((a) => f(a).thunk()))
    }

    export function fromSync<A>(sync: Sync.Sync<A>) {
        return fromThunk(() => sync.thunk())
    }
}

const logMessage = (message: string) => Async.fromThunk(() => {
    console.log(message)
})

const program = pipe(
    Async.fromAsync(() => fs.readFile("./package.json")),
    Async.map((buffer) => buffer.toString("utf-8")),
    Async.flatMap((content) => logMessage("Content of package.json:" + content))
)

program.thunk().catch(console.error)

logMessage("hello").thunk()