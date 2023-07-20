import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHealth(): { status: string; time: number } {
    return {
      status: 'OK',
      time: Date.now(),
    };
  }
}
