import { Environment } from "./environment.js";
import { ReturnThrow } from "./error.js";
import type { Interpreter } from "./interpreter.js";
import type { LoxInstance } from "./lox-class.js";
import type { Function } from "./statements.js";

export abstract class LoxCallable {
  abstract arity(): number;
  abstract call(interpreter: Interpreter, args: unknown[]): unknown;
}

export class LoxFunction extends LoxCallable {
  constructor(
    public readonly declaration: Function,
    public readonly closure: Environment,
    public readonly isInitializer: boolean,
  ) {
    super();
  }

  override call(interpreter: Interpreter, args: unknown[]): unknown {
    const environment = new Environment(this.closure);

    for (let i = 0; i < this.declaration.params.length; ++i) {
      environment.define(this.declaration.params[i]!.lexeme, args[i]);
    }
    try {
      interpreter.executeBlock(this.declaration.body, environment);
    } catch (returnValue) {
      if (returnValue instanceof ReturnThrow) {
        if (this.isInitializer) {
          return this.closure.getAt(0, "this");
        }

        return returnValue.value;
      } else {
        throw returnValue;
      }
    }

    if (this.isInitializer) {
      return this.closure.getAt(0, "this");
    }
    return null;
  }

  override arity(): number {
    return this.declaration.params.length;
  }

  override toString(): string {
    return `<fn ${this.declaration.name.lexeme}>`;
  }

  bind(instance: LoxInstance): LoxFunction {
    const environment = new Environment(this.closure);
    environment.define("this", instance);
    return new LoxFunction(this.declaration, environment, this.isInitializer);
  }
}
