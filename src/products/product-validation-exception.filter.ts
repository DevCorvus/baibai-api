import {
  Catch,
  ExceptionFilter,
  BadRequestException,
  ArgumentsHost,
} from '@nestjs/common';
import { NextFunction, Request } from 'express';
import { existsSync, unlink } from 'fs';

@Catch(BadRequestException)
export class ProductValidationExceptionFilter implements ExceptionFilter {
  catch(exception: BadRequestException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const req = ctx.getRequest<Request>();
    const next = ctx.getNext<NextFunction>();

    if (req.file && req.file.path && existsSync(req.file.path)) {
      unlink(req.file.path, (err) => {
        if (err) console.error(err);
      });
    }

    next(exception);
  }
}
