import { ExecutionContext, createParamDecorator } from '@nestjs/common';

export const UserID = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const req = ctx.switchToHttp().getRequest();
    return req.user.userId as string;
  },
);
