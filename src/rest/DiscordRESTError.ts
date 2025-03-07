import type { Request } from './request';

/** An Discord error from a request. */
export class DiscordRESTError extends Error {
  /** The client request of the error. */
  readonly req: Request;
  /** The response from the server. */
  readonly res: Response;
  /** The response class from a {@link Server}. */
  readonly response: any;
  /** The error code from the response. */
  readonly code: number;
  /** The message of the error. */
  readonly message: string;
  /** The error stack. */
  readonly stack: string;

  /**
   * @param req A client request
   * @param res An incoming message from the server
   * @param response A response's body
   * @param stack The error stack
   */
  constructor(req: Request, res: Response, response: any, stack: string) {
    super();

    this.req = req;
    this.res = res;
    this.response = response;
    this.code = res.status;

    let message = response?.message || 'Unknown error';
    if (response?.errors) message += '\n  ' + this.flattenErrors(response.errors).join('\n  ');
    else if (response) {
      const errors = this.flattenErrors(response);
      if (errors.length > 0) message += '\n  ' + errors.join('\n  ');
    }
    this.message = message;

    if (stack) this.stack = this.name + ': ' + this.message + '\n' + stack;
    else {
      // Set stack before capturing to avoid TS error
      this.stack = '';
      Error.captureStackTrace(this, DiscordRESTError);
    }
  }

  get name(): string {
    return `${this.constructor.name} [${this.code}]`;
  }

  private flattenErrors(errors: any, keyPrefix = ''): string[] {
    let messages: string[] = [];
    for (const fieldName in errors) {
      if (!(fieldName in errors) || fieldName === 'message' || fieldName === 'code') {
        continue;
      }
      if (fieldName === '_errors') {
        messages = messages.concat(
          errors._errors.map((obj: any) => `${keyPrefix ? `${keyPrefix}: ` : ''}${obj.message}`)
        );
        continue;
      }
      if (errors[fieldName]._errors) {
        messages = messages.concat(
          errors[fieldName]._errors.map((obj: any) => `${keyPrefix + fieldName}: ${obj.message}`)
        );
      } else if (Array.isArray(errors[fieldName])) {
        messages = messages.concat(errors[fieldName].map((str: string) => `${keyPrefix + fieldName}: ${str}`));
      } else if (typeof errors[fieldName] === 'object') {
        messages = messages.concat(this.flattenErrors(errors[fieldName], keyPrefix + fieldName + '.'));
      }
    }
    return messages;
  }
}
