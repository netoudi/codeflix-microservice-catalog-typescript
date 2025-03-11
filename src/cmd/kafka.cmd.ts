import { SchemaRegistryClient } from '@confluentinc/schemaregistry';
import { NestFactory } from '@nestjs/core';
import { Transport } from '@nestjs/microservices';
import { AppModule } from '@/app.module';
import { SchemaRegistryDeserializer } from '@/modules/kafka-module/schema-registry-deserializer';

async function bootstrap() {
  const app = await NestFactory.createMicroservice(AppModule, {
    transport: Transport.KAFKA,
    options: {
      client: {
        brokers: ['host.docker.internal:9092'],
      },
      consumer: {
        groupId: 'categories-consumer-' + Math.random(),
      },
      deserializer: new SchemaRegistryDeserializer(
        new SchemaRegistryClient({ baseURLs: ['host.docker.internal:8081'] }),
      ),
    },
  });
  await app.listen();
}

bootstrap();
