import { pipe } from "fp-ts/function";
import * as A from "fp-ts/Array";
import * as O from "fp-ts/Option";
import * as NEA from "fp-ts/NonEmptyArray";
import type { NodePath, PluginObj } from "@babel/core";
import { Expression, CallExpression } from "@babel/types";

type B = typeof import("@babel/core");

const IMPORT_PATH = "fp-ts/function";

const visitor = (t: typeof import("@babel/types")) => (
    path: NodePath<CallExpression>
): void => {
    const { callee, arguments: args } = path.node;
    const someCallee = pipe(
        O.some(callee),
        O.filter(t.isIdentifier),
        O.filter((callee) => callee.name === "pipe")
    );

    const isFpTs = pipe(
        someCallee,
        O.chainNullableK(() => path.scope.getBinding("pipe")),
        O.map((ref) => ref.path.parent),
        O.filter(t.isImportDeclaration),
        O.filter((decl) => decl.source.value === IMPORT_PATH),
        O.fold(
            () => false,
            () => true
        )
    );

    const newCallExpr = pipe(
        O.Do,
        O.filter(() => isFpTs),
        O.bind("args", () =>
            pipe(
                args,
                NEA.fromArray,
                O.filter((arr): arr is NEA.NonEmptyArray<Expression> =>
                    arr.every((x): x is Expression => t.isExpression(x))
                )
            )
        ),
        O.bind("head", ({ args }) => pipe(args, NEA.head, O.some)),
        O.bind("tail", ({ args }) => pipe(args, NEA.tail, O.some)),
        O.map(({ head, tail }) =>
            pipe(
                tail,
                A.reduce(head, (arg, callee) => t.callExpression(callee, [arg]))
            )
        ),
        O.toNullable
    );

    if (newCallExpr === null) {
        return;
    }

    path.replaceWith(newCallExpr);
};

export default function OptimizePipe({ types: t }: B): PluginObj {
    return {
        name: "babel-plugin-optimize-pipe",
        visitor: {
            CallExpression: visitor(t),
        },
    };
}
