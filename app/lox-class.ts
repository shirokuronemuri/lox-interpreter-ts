import type { Interpreter } from "./interpreter.js";
import { LoxCallable } from "./lox-function.js";

export class LoxClass extends LoxCallable {
  constructor(
    public readonly name: string
  ) {
    super();
  }

  override call(interpreter: Interpreter, args: unknown[]): unknown {
    const instance = new LoxInstance(this);
    return instance;
  }

  override arity(): number {
    return 0;
  }

  override toString(): string {
    return this.name;
  }
};

export class LoxInstance {
  constructor(
    public loxClass: LoxClass
  ) { }

  toString(): string {
    return `${this.loxClass.name} instance`;
  }
}
