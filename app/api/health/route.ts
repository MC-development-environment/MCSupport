import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

type HealthStatus = 'healthy' | 'degraded' | 'unhealthy';

interface HealthCheckResponse {
    status: HealthStatus;
    timestamp: string;
    uptime: number;
    version: string;
    checks: {
        database: {
            status: 'ok' | 'error';
            latencyMs?: number;
            error?: string;
        };
        memory: {
            usedMB: number;
            totalMB: number;
            percentUsed: number;
        };
    };
}

/**
 * Health Check Endpoint
 * 
 * GET /api/health
 * 
 * Returns system health status including:
 * - Database connectivity
 * - Memory usage
 * - Uptime
 * - Version info
 * 
 * Used by:
 * - Load balancers / Reverse proxies
 * - Kubernetes health probes
 * - Monitoring systems (Datadog, New Relic, etc.)
 */
export async function GET(): Promise<NextResponse<HealthCheckResponse>> {
    const startTime = Date.now();
    
    // Check database connectivity
    let dbStatus: 'ok' | 'error' = 'error';
    let dbLatency = 0;
    let dbError: string | undefined;
    
    try {
        const dbStart = Date.now();
        await prisma.$queryRaw`SELECT 1`;
        dbLatency = Date.now() - dbStart;
        dbStatus = 'ok';
    } catch (error) {
        dbError = error instanceof Error ? error.message : 'Unknown database error';
    }
    
    // Memory usage
    const memoryUsage = process.memoryUsage();
    const usedMB = Math.round(memoryUsage.heapUsed / 1024 / 1024);
    const totalMB = Math.round(memoryUsage.heapTotal / 1024 / 1024);
    const percentUsed = Math.round((memoryUsage.heapUsed / memoryUsage.heapTotal) * 100);
    
    // Determine overall status
    let status: HealthStatus = 'healthy';
    if (dbStatus === 'error') {
        status = 'unhealthy';
    } else if (percentUsed > 90) {
        status = 'degraded';
    }
    
    const response: HealthCheckResponse = {
        status,
        timestamp: new Date().toISOString(),
        uptime: Math.floor(process.uptime()),
        version: process.env.npm_package_version || '0.1.0',
        checks: {
            database: {
                status: dbStatus,
                latencyMs: dbStatus === 'ok' ? dbLatency : undefined,
                error: dbError
            },
            memory: {
                usedMB,
                totalMB,
                percentUsed
            }
        }
    };
    
    // Return appropriate HTTP status code
    const httpStatus = status === 'healthy' ? 200 : status === 'degraded' ? 200 : 503;
    
    return NextResponse.json(response, { 
        status: httpStatus,
        headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'X-Response-Time': `${Date.now() - startTime}ms`
        }
    });
}
