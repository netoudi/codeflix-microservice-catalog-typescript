import { DiscoveryModule } from '@golevelup/nestjs-discovery';
import { Module } from '@nestjs/common';
import { KConnectEventPatternRegister } from '@/modules/kafka-module/kconnect-event-pattern.register';

@Module({
  imports: [DiscoveryModule],
  providers: [KConnectEventPatternRegister],
  exports: [KConnectEventPatternRegister],
})
export class KafkaModule {}
