import * as B from "@babel/core";
import plugin from "./index";

it("common case", async () => {
    const result = await assert(`
        import { pipe } from 'fp-ts/function';
        pipe(a, b, c, d);
    `);
    expect(result).toMatchInlineSnapshot(`
        "import { pipe } from 'fp-ts/function';
        d(c(b(a)));"
    `);
});

it("with inline functions", async () => {
    const result = await assert(`
        import { pipe } from 'fp-ts/function';
        pipe(a, x => x + 1, c, d);
    `);
    expect(result).toMatchInlineSnapshot(`
        "import { pipe } from 'fp-ts/function';
        d(c((x => x + 1)(a)));"
    `);
});

it("arg spread", async () => {
    const result = await assert(`
        import { pipe } from 'fp-ts/function';
        pipe(a, b, c, ...d);
    `);
    expect(result).toMatchInlineSnapshot(`
        "import { pipe } from 'fp-ts/function';
        pipe(a, b, c, ...d);"
    `);
});

async function assert(code: string): Promise<string | null | undefined> {
    const result = await B.transformAsync(code, {
        filename: "example.ts",
        plugins: [plugin],
        babelrc: false,
        configFile: false,
        cwd: "/",
    });
    return result?.code;
}
