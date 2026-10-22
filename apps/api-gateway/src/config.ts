export const config = {
  porta: Number(process.env.PORT ?? 3000),
  jwtSecret: process.env.JWT_SECRET ?? 'dev-secret-troque-em-producao',
  jwtExpiraEmSegundos: Number(process.env.JWT_EXPIRES_IN ?? 3600),
  appPassword: process.env.APP_PASSWORD ?? 'sd2026',
  registroUrl: process.env.REGISTRO_GRPC_URL ?? 'localhost:50052',
  matriculaUrl: process.env.MATRICULA_GRPC_URL ?? 'localhost:50051',
  grpcDeadlineMs: Number(process.env.GRPC_DEADLINE_MS ?? 8000),
};
