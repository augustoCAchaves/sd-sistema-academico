export const config = {
  porta: Number(process.env.GRPC_PORT ?? 50051),
  databaseUrl: process.env.DATABASE_URL ?? 'postgresql://academico:academico@localhost:5433/matricula_db',
  registroUrl: process.env.REGISTRO_GRPC_URL ?? 'localhost:50052',
  registroDeadlineMs: Number(process.env.REGISTRO_DEADLINE_MS ?? 2000),
};
