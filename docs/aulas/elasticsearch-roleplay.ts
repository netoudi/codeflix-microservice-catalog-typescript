// replicar tudo que está em es.http, porém aqui com typescript
// DEBUG=elasticsearch npx tsx docs/aulas/elasticsearch-roleplay.ts
import { Client } from '@elastic/elasticsearch';

const client = new Client({ node: 'http://host.docker.internal:9200' });

const indexName = 'aula';

export async function deleteIndex() {
  try {
    const result = await client.indices.delete({
      index: indexName,
    });
    console.log(result);
    console.log('Index deleted');
  } catch (error) {
    console.error('An error occurred:', error);
  }
}

//criar um índice
export async function createIndex() {
  try {
    await client.indices.create({
      index: indexName,
    });
    console.log('Index created');
  } catch (error) {
    console.error('An error occurred:', error);
  }
}

export async function insertDocument() {
  try {
    const result = await client.index({
      index: indexName,
      refresh: true,
      body: {
        name: 'Luiz',
        age: 25,
      },
    });
    return result;
  } catch (error) {
    console.error('An error occurred:', error);
  }
}

export async function updateDocument(id: string) {
  console.log({ updateDocument: id });
  try {
    const result = await client.update({
      index: indexName,
      id: id,
      refresh: true,
      body: {
        doc: {
          age: 26,
        },
      },
    });
    console.log(result);
  } catch (error) {
    console.error('An error occurred:', error);
  }
}

export async function deleteDocument(id: string) {
  try {
    const result = await client.delete({
      index: indexName,
      refresh: true,
      id,
    });
    console.log(result);
  } catch (error) {
    console.error('An error occurred:', error);
  }
}

export async function search() {
  try {
    const result = await client.search({
      index: indexName,
      body: {
        query: {
          match: {
            name: 'Luiz',
          },
        },
      },
    });
    console.dir(result, { depth: null });
  } catch (error) {
    console.error('An error occurred:', error);
  }
}

async function bootstrap() {
  await deleteIndex();
  await createIndex();
  const result = await insertDocument();
  // @ts-expect-error - ignorar erro de tipo
  const { _id } = result?.body;
  await updateDocument(_id);
  await search();
  await deleteDocument(_id);
}

bootstrap();
