import { serviceConfig } from '@/config/gateway.config';
import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class ProxyService {
  private readonly logger = new Logger(ProxyService.name)

  constructor(private readonly httpService: HttpService) { }

  async proxyRequest(
    serviceName: keyof typeof serviceConfig,
    path: string,
    method: string,
    data?: any,
    headers?: any,
    userInfo?: any
  ) {
    const service = serviceConfig[serviceName]
    const url = `${service.url}/${path}`

    this.logger.log(`Proxying ${method} request to ${serviceName}: ${url}`)

    try {
      const enhanceHeaders = {
        ...headers,
        'x-user-id': userInfo?.userId?.toString(),
        'x-user-email': userInfo?.email,
        'x-user-role': userInfo?.role || '',
      }

      const response = await firstValueFrom(
        this.httpService.request({
          method: method.toLowerCase() as any,
          url,
          data,
          headers: enhanceHeaders,
          timeout: service.timeout,
        })
      )

      return response

    } catch (error) {
      this.logger.error(`Error proxying request to ${serviceName}: ${error}`)
      throw error
    }
  }


  async getServiceHealth(serviceName: keyof typeof serviceConfig) {
    try {
      const service = serviceConfig[serviceName]
      const response = firstValueFrom(
        this.httpService.get(`${service.url}/health`, {
          timeout: 5000
        })
      )

      return { status: 'healthy', data: (await response).data }
    } catch (error) {
      return { status: 'unhealthy', error: error.message }
    }
  }
}
