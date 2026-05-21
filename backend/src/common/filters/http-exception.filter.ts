import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';

function isPrismaKnownRequestError(error: unknown): error is { code: string; meta?: Record<string, unknown>; message?: string } {
  return typeof error === 'object' && error !== null && 'code' in error && typeof (error as { code?: unknown }).code === 'string';
}

function mapPrismaError(error: { code: string; meta?: Record<string, unknown>; message?: string }): { status: number; message: string | Record<string, unknown> } {
  switch (error.code) {
    case 'P2002':
      return {
        status: HttpStatus.CONFLICT,
        message: {
          error: 'Unique constraint violated',
          details: error.meta ?? {},
        },
      };
    case 'P2003':
      return {
        status: HttpStatus.BAD_REQUEST,
        message: {
          error: 'Foreign key constraint violated',
          details: error.meta ?? {},
        },
      };
    case 'P2025':
      return {
        status: HttpStatus.NOT_FOUND,
        message: {
          error: 'Record not found',
          details: error.meta ?? {},
        },
      };
    default:
      return {
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error.message ?? 'Database error',
      };
  }
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    const prismaError = isPrismaKnownRequestError(exception) ? exception : null;
    const prismaMapped = prismaError ? mapPrismaError(prismaError) : null;

    const status = exception instanceof HttpException
      ? exception.getStatus()
      : prismaMapped?.status ?? HttpStatus.INTERNAL_SERVER_ERROR;

    const message = exception instanceof HttpException
      ? exception.getResponse()
      : prismaMapped?.message ?? 'Internal server error';

    this.logger.error(
      exception instanceof Error
        ? exception.stack ?? exception.message
        : prismaError
          ? `Prisma ${prismaError.code}: ${prismaError.message ?? 'Unknown database error'}`
          : JSON.stringify(exception),
    );

    response.status(status).json({
      statusCode: status,
      message,
      timestamp: new Date().toISOString(),
    });
  }
}
