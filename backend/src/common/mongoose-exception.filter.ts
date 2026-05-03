import { ExceptionFilter, Catch, ArgumentsHost, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import { Error as MongooseError } from 'mongoose';

@Catch(MongooseError)
export class MongooseExceptionFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    if (exception instanceof MongooseError.ValidationError) {
      const messages = Object.values(exception.errors).map((e: any) => e.message);
      response.status(HttpStatus.BAD_REQUEST).json({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Validation failed',
        errors: messages,
      });
      return;
    }

    if (exception instanceof MongooseError.CastError) {
      response.status(HttpStatus.BAD_REQUEST).json({
        statusCode: HttpStatus.BAD_REQUEST,
        message: exception.message,
      });
      return;
    }

    if (exception.code === 11000) {
      response.status(HttpStatus.CONFLICT).json({
        statusCode: HttpStatus.CONFLICT,
        message: 'Duplicate key error',
      });
      return;
    }

    if (exception.name === 'MongoError' || exception.name === 'MongoServerError') {
      response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Database error',
      });
      return;
    }

    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: exception.message || 'Internal server error',
    });
  }
}
