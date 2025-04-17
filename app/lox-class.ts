import { RuntimeError } from "./error.js";
import type { Interpreter } from "./interpreter.js";
import { LoxCallable, LoxFunction } from "./lox-function.js";
import type { Token } from "./types.js";

export class LoxClass extends LoxCallable {
  readonly #methods: Map<string, LoxFunction>;

  constructor(
    public readonly name: string,
    methods: Map<string, LoxFunction>
  ) {
    super();
    this.#methods = methods;
  }

  override call(interpreter: Interpreter, args: unknown[]): unknown {
    const instance = new LoxInstance(this);
    const initializer = this.findMethod('init');
    if (initializer) {
      initializer.bind(instance).call(interpreter, args);
    }
    return instance;
  }

  override arity(): number {
    const intializer = this.findMethod('init');
    return intializer?.arity() ?? 0;
  }

  override toString(): string {
    return this.name;
  }

  findMethod(name: string): LoxFunction | undefined {
    return this.#methods.get(name);
  }
};

export class LoxInstance {
  readonly #fields: Map<string, unknown> = new Map();
  constructor(
    public loxClass: LoxClass
  ) { }

  toString(): string {
    return `${this.loxClass.name} instance`;
  }

  get(name: Token): unknown {
    if (this.#fields.has(name.lexeme)) {
      return this.#fields.get(name.lexeme);
    }

    const method = this.loxClass.findMethod(name.lexeme);
    if (method) return method.bind(this);

    throw new RuntimeError(name, `Undefined property "${name.lexeme}".`);
  }

  set(name: Token, value: unknown) {
    this.#fields.set(name.lexeme, value);
  }
}
