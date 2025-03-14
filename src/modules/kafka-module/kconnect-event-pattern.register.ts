import { DiscoveryService } from '@golevelup/nestjs-discovery';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventPattern } from '@nestjs/microservices';
import { K_CONNECT_TOPIC_METADATA } from '@/modules/kafka-module/kconnect-event-pattern.decorator';

@Injectable()
export class KConnectEventPatternRegister {
  constructor(
    private readonly configService: ConfigService,
    private readonly discoverService: DiscoveryService,
  ) {}

  // precisa registrar antes de chamar o listen do microservice
  // para que os eventpattern personalizados sejam registrados
  // um evento de módulo init ou similar é executado depois que o listen já identificou os eventpatterns padrões
  async registerKConnectTopicDecorator() {
    const methodsDiscovered =
      await this.discoverService.methodsAndControllerMethodsWithMetaAtKey(K_CONNECT_TOPIC_METADATA);

    methodsDiscovered.forEach((method) => {
      const topicName = KConnectEventPatternRegister.kConnectTopicName(
        this.configService.get('kafka.connect_prefix') as string,
        method.meta as string,
      );
      Reflect.decorate(
        [EventPattern(topicName)],
        method.discoveredMethod.parentClass.injectType?.prototype,
        method.discoveredMethod.methodName,
        Reflect.getOwnPropertyDescriptor(
          method.discoveredMethod.parentClass.injectType?.prototype,
          method.discoveredMethod.methodName,
        ),
      );
    });
  }

  static kConnectTopicName(prefix: string, topic: string) {
    return `${prefix}.${topic}`;
  }
}
