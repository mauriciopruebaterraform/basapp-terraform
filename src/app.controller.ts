import { Controller, Get, VERSION_NEUTRAL } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AppService } from './app.service';
import { Public } from './auth/public.decorator';

@Controller({
  version: VERSION_NEUTRAL,
})
export class AppController {
  constructor(private readonly appService: AppService) {}

  @ApiOperation({ summary: 'Root endpoint' })
  @ApiResponse({
    status: 200,
    description: 'Successful response',
    content: {
      'application/json': { schema: { type: 'string' }, example: 'Basapp api' },
    },
  })
  @Public()
  @Get('/')
  getRoot(): string {
    return 'Basapp api';
  }
}
