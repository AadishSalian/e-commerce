// Simulated database query monitoring wrapper for Prisma
// This logs slow queries to the console or an external monitoring service

const SLOW_QUERY_THRESHOLD_MS = 100; // Flag queries slower than 100ms

export function withQueryMonitoring(prismaClient: any) {
  // If Prisma were un-mocked and using the real client, we would use Prisma extensions or events:
  // prismaClient.$on('query', (e) => {
  //   if (e.duration > SLOW_QUERY_THRESHOLD_MS) {
  //     console.warn(`[SLOW QUERY] ${e.query} took ${e.duration}ms`);
  //     // send to Sentry, Datadog, etc.
  //   }
  // });

  // For our mocked environment, we can wrap the proxy to simulate monitoring
  return new Proxy(prismaClient, {
    get(target, model) {
      if (typeof model === 'string' && !model.startsWith('$')) {
        return new Proxy({}, {
          get(target, method) {
            return async (...args: any[]) => {
              const start = Date.now();
              
              // Simulate random network/db delay
              const delay = Math.random() * 150; 
              await new Promise(resolve => setTimeout(resolve, delay));
              
              const duration = Date.now() - start;
              
              if (duration > SLOW_QUERY_THRESHOLD_MS) {
                console.warn(`[DB MONITOR] SLOW QUERY DETECTED: \${model}.\${String(method)} took \${duration}ms`);
                // In production, this would trigger an alert or be logged to a monitoring service
              }
              
              // Return mock data fallback
              return [];
            };
          }
        });
      }
      return target[model];
    }
  });
}
