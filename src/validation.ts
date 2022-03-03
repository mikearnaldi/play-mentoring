// import { pipe } from "./pipe"
import { Either, right, left } from "./either"


// export type Grammar = Primitive1 | Rule1 | Primitive2 | ...

// export type MathGrammar = Number | Addition | Multiplication | etc

// given A, B construct a codec for A | B

class Codec<A> {
    constructor(
        readonly decode: (u: unknown) => Either<string, A>,
        readonly encode: (a: A) => unknown
    ) {}

    readonly fromJSON = (s: string) => this.decode(JSON.parse(s))
    readonly toJSON = (a: A) => JSON.stringify(this.encode(a))
}

const string = new Codec<string>(
    (u) => typeof u === "string" ? right(u) : left("not a string"),
    (a) => a
)

const number = new Codec<number>(
    (u) => typeof u === "number" ? right(u) : left("not a number"),
    (a) => a
)

// type KeyValue = [string, string]
// 
// const record = new Codec<KeyValue[]>(
//     (u) => Array.isArray(u) ? doesItHaveDuplicate() ? left : right,
//     0 as any
// )

// given A and B create a Codec for (A & B)

// given A create a codec for Array<A>

const date = new Codec<Date>(
    (u) => {
        if (typeof u === "string") {
            const d = new Date(u)
            if (Number.isNaN(d.getTime())) {
                return right(d)
            }
            return left("not an iso date")
        } else {
            return left("not an iso date")
        }
    },
    a => a.toISOString()
)

declare const required: <FieldCodecs extends {[k: string]: Codec<any>}>(codecs: FieldCodecs) => Codec<{
    readonly [k in keyof FieldCodecs]: [FieldCodecs[k]] extends [Codec<infer A>] ? A : never
}>

// DIFFERENT
declare const optional: <FieldCodecs extends {[k: string]: Codec<any>}>(codecs: FieldCodecs) => Codec<{
    readonly [k in keyof FieldCodecs]: [FieldCodecs[k]] extends [Codec<infer A>] ? A : never
}>


// INTERSECTION BETWEEN OPTIONAL AND REQUIRED

export type TypeOf<C extends Codec<any>> = [C] extends [Codec<infer X>] ? X : never

// export type MyError = Tree<Exeption>


// USAGE


const person_ = required({
    firstName: string,
    lastName: string,
    age: number
})

export interface Person extends TypeOf<typeof person_> {}
export const person: Codec<Person> = person_

const resultOfCodec = person.decode({})
