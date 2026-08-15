import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import * as Sentry from '@sentry/node';
import { env } from './config/env.js';
import { isDbReady } from './config/db.js';
import { mongoSanitize } from './middleware/mongoSanitize.js';
import { errorHandler } from './middleware/validate.js';
import apiRouter from './routes.js';
import * as billingController from './modules/billing/billing.controller.js';

export function createApp() {
  const app = express();

  if (env.SENTRY_DSN) {
    Sentry.init({
      dsn: env.SENTRY_DSN,
      environment: env.NODE_ENV,
      beforeSend(event) {
        if (event.request?.headers) {
          delete event.request.headers.authorization;
          delete event.request.headers.cookie;
        }
        return event;
      },
    });
  }

  app.get('/health', (_req, res) => {
    res.status(200).json({ success: true, data: { status: 'ok' } });
  });

  app.get('/ready', (_req, res) => {
    if (!isDbReady()) {
      res.status(503).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Database not ready' },
      });
      return;
    }
    res.status(200).json({ success: true, data: { status: 'ready' } });
  });

  app.use(helmet());
  app.use(
    cors({
      origin: env.CORS_ORIGINS.split(',').map((o) => o.trim()),
      credentials: true,
      methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    }),
  );

  // Stripe webhook needs raw body — mount before json parser
  app.post(
    '/api/v1/billing/webhook',
    express.raw({ type: 'application/json' }),
    billingController.webhook,
  );

  app.use(express.json({ limit: '10kb' }));
  app.use(express.urlencoded({ extended: true, limit: '10kb' }));
  app.use(cookieParser());
  app.use(mongoSanitize);

  if (env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
  }

  const globalLimiter = rateLimit({
    windowMs: 60_000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      error: { code: 'RATE_LIMIT_EXCEEDED', message: 'Too many requests' },
    },
  });
  app.use('/api', globalLimiter);

  const authLimiter = rateLimit({
    windowMs: 60_000,
    max: 10,
    skipSuccessfulRequests: true,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      error: { code: 'RATE_LIMIT_EXCEEDED', message: 'Too many auth attempts' },
    },
  });
  app.use('/api/v1/auth', authLimiter);

  app.use('/api/v1', apiRouter);

  app.use(errorHandler);
  return app;
}
