import crypto from 'node:crypto';
import { ElasticsearchService } from '@nestjs/elasticsearch';
import { ElasticsearchContainer, StartedElasticsearchContainer } from '@testcontainers/elasticsearch';
import { esMapping } from '@/core/shared/infra/db/elastic-search/es-mapping';

global.fail = (message: string) => {
  throw new Error(message);
};

export function setupElasticsearch() {
  let _esClient: ElasticsearchService;
  let _startedContainer: StartedElasticsearchContainer;
  let _indexName: string;

  beforeAll(async () => {
    const esContainer = new ElasticsearchContainer('elasticsearch:7.17.7');
    _startedContainer = await esContainer.start();
  }, 120_000);

  beforeEach(async () => {
    _indexName = 'test_es_' + crypto.randomBytes(4).toString('hex');
    _esClient = new ElasticsearchService({ node: _startedContainer.getHttpUrl() });
    await _esClient.indices.create({ index: _indexName, body: { mappings: esMapping } });
  });

  afterEach(async () => {
    await _esClient?.indices?.delete({ index: _indexName });
  });

  afterAll(async () => {
    await _startedContainer?.stop();
  });

  return {
    get esClient() {
      return _esClient;
    },
    get indexName() {
      return _indexName;
    },
    get container() {
      return _startedContainer;
    },
    get esUrl() {
      return _startedContainer.getHttpUrl();
    },
  };
}
