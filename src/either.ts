
export type Either<E, A> = Left<E> | Right<A>

export class Left<E> {
    readonly _tag = "Left"
    constructor(readonly left: E) { }
}

export class Right<A> {
    readonly _tag = "Right"
    constructor(readonly right: A) { }
}

export function left<E>(left: E): Either<E, never> {
    return new Left(left)
}

export function right<A>(right: A): Either<never, A> {
    return new Right(right)
}

export function map<A, B>(f: (a: A) => B) {
    return <E>(self: Either<E, A>): Either<E, B> => self._tag === "Right" ? right(f(self.right)) : self
}

export function chain<A, B, E1>(f: (a: A) => Either<E1, B>) {
    return <E>(self: Either<E, A>): Either<E | E1, B> => self._tag === "Right" ? f(self.right) : self
}

export function zip<E1, A1>(that: Either<E1, A1>) {
    return <E0, A0>(self: Either<E0, A0>): Either<E0 | E1, [A0, A1]> => self._tag === "Left" ? self : that._tag === "Left" ? that : right([self.right, that.right])
}

// type example = { first: "Mike" } extends { first: infer A }  ? A : never

export declare const validateAll: <E>(Semi: Semigroup<E>) => <Eithers extends readonly Either<E, any>[]>(...all: Eithers) => Either<
    E,
    {
        [k in keyof Eithers]: [Eithers[k]] extends [Either<E, infer A>] ? A : never
    }
>

export function zip2<E>(Semi: Semigroup<E>) {
    return <A1>(that: Either<E, A1>) => <A0>(self: Either<E, A0>): Either<E, [A0, A1]> => {
        if (self._tag === "Left" && that._tag === "Left") {
            return left(Semi.concat(self.left, that.left))
        } else {
            if (self._tag === "Left") {
                return self
            } else if (that._tag === "Left") {
                return that
            } else {
                return right([self.right, that.right])
            }
        }
    }
}

export interface Semigroup<A> {
    concat: (x: A, y: A) => A
}

export interface Monoid<A> extends Semigroup<A> {
    zero: () => A
}

export const SemigroupString: Semigroup<string> = {
    concat: (x, y) => `${x} | ${y}`
}


const validate = zip2(SemigroupString)

declare const validateFirstName: (o: {}) => Either<string, { first: string }>
declare const validateLastName: (o: {}) => Either<string, { last: string }>
declare const validateAge: (o: {}) => Either<string, { age: number }>

const result = validateAll(SemigroupString)(
    validateFirstName({}),
    validateLastName({}),
    validateAge({})
)