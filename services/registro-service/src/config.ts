export const config = {
  porta: Number(process.env.GRPC_PORT ?? 50052),
  databaseUrl: process.env.DATABASE_URL ?? 'postgresql://academico:academico@localhost:5432/registro_db',
};
