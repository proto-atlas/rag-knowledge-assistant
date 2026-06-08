# Vectorize index setup確認記録

生成日時: 2026-04-30T22:29:44.7288435+09:00
確認環境: ローカル実行
確認種別: Cloudflare Vectorize setup確認
結果: 通過 / index created

この記録は、最初のVectorize indexに対する特定時点のsetup logである。
indexとmetadata indexを作成したことを記録します。検索品質を証明するものではありません。

確認したsetup:

- Vectorize index `rag-bge-m3-v1` が存在する。
- Index dimensionsは`1024`。
- Index metricは`cosine`。
- `indexVersion`と`category`向けのmetadata indexが存在する。
- `wrangler.jsonc` に `AI` binding、`RAG_VECTOR_INDEX` binding、`RAG_ACTIVE_INDEX_VERSION` variableがある。

この記録に含めない範囲:

- このsetup確認ではvectorをupsertしていません。
- Vectorize queryは実行していません。
- D1 migrationは実行していません。
- Claude API callは実行していません。
- Cloudflare deployは実行していません。

## 公式docs確認

- Cloudflare Vectorize Wrangler commandsでは、`vectorize create` と `--dimensions`、`--metric`、`--preset`、`--binding`、`--update-config` が説明されている。
- Cloudflare Vectorize create-index guidanceでは、dimensionsとmetricはindexごとに固定されると説明されている。
- Cloudflare Vectorize metadata filteringでは、filter対象のmetadata propertyごとにmetadata indexが必要。
- Cloudflare Workers AI bindingでは `env.AI.run()` を使う。
- 2026-04-30 にlocal Wrangler helpを確認した。インストール済みWranglerは `vectorize create --preset` を受け付けるが、表示されたpreset choicesに `@cf/baai/bge-m3` は含まれていない。
- local Wrangler helpでmetadata index flagsの`--propertyName`と`--type`を確認した。
- Cloudflare AI Search supported-model docsでは、`@cf/baai/bge-m3` は1024 dimensions / `cosine` metricとして記載されている。

## 作成したindex

| 項目 | 値 | 記録 |
|---|---|---|
| 索引名 | `rag-bge-m3-v1` | `wrangler vectorize create` 出力 |
| 埋め込みモデル | `@cf/baai/bge-m3` | Workers AIの次元数確認記録 |
| バインディング名 | `RAG_VECTOR_INDEX` | `wrangler.jsonc` |
| 有効な索引バージョン | `rag-bge-m3-v1` | `wrangler.jsonc` |
| 次元数 | 1024 | Workers AI確認とVectorize情報 |
| 距離指標 | cosine | Cloudflare AI Search docsとVectorize作成出力 |
| メタデータ索引: `indexVersion` | string | `wrangler vectorize list-metadata-index` 出力 |
| メタデータ索引: `category` | string | `wrangler vectorize list-metadata-index` 出力 |

## 実行したコマンド

Index作成:

```bash
corepack pnpm wrangler vectorize create rag-bge-m3-v1 --dimensions 1024 --metric cosine --binding RAG_VECTOR_INDEX --json
```

Metadata index:

```bash
corepack pnpm wrangler vectorize create-metadata-index rag-bge-m3-v1 --propertyName indexVersion --type string
corepack pnpm wrangler vectorize create-metadata-index rag-bge-m3-v1 --propertyName category --type string
```

確認:

```bash
corepack pnpm wrangler vectorize info rag-bge-m3-v1 --json
corepack pnpm wrangler vectorize list-metadata-index rag-bge-m3-v1 --json
```

## index作成出力

```json
{
  "created_on": "2026-04-30T13:24:56.907907Z",
  "modified_on": "2026-04-30T13:24:56.907907Z",
  "name": "rag-bge-m3-v1",
  "description": "",
  "config": {
    "dimensions": 1024,
    "metric": "cosine"
  }
}
```

## setup時のindex info出力

コマンド:

```bash
corepack pnpm wrangler vectorize info rag-bge-m3-v1 --json
```

出力:

```json
{
  "dimensions": 1024,
  "vectorCount": 0,
  "processedUpToDatetime": "2026-04-30T13:25:38.147Z",
  "processedUpToMutation": "2c6be9e1-9e22-4fed-8229-60bf1a7686b8"
}
```

## metadata index出力

コマンド:

```bash
corepack pnpm wrangler vectorize list-metadata-index rag-bge-m3-v1 --json
```

出力:

```json
[
  {
    "propertyName": "indexVersion",
    "indexType": "String"
  },
  {
    "propertyName": "category",
    "indexType": "String"
  }
]
```

## `wrangler.jsonc` Binding差分

追加したbinding名とindex名:

```text
ai.binding = AI
vectorize[0].binding = RAG_VECTOR_INDEX
vectorize[0].index_name = rag-bge-m3-v1
vars.RAG_ACTIVE_INDEX_VERSION = rag-bge-m3-v1
```

この時点では追加していないsecret:

```text
RAG_ACCESS_KEY secret
RAG_ADMIN_ACCESS_KEY secret
RAG_ANTHROPIC_API_KEY secret
```

## pass基準

- Vectorize indexが存在する: 通過。
- 作成したindexが意図したdimensionsとmetricを使っている: 通過。
- `RAG_VECTOR_INDEX` bindingが意図したindexを指していることを `wrangler.jsonc` で確認しました。
- `indexVersion` metadata indexが存在する: 通過。
- `category` metadata indexが存在する: 通過。
- `RAG_ACTIVE_INDEX_VERSION` がprovider query filterで使うactive index versionと一致していることを `wrangler.jsonc` で確認しました。
- この記録にsecret、cookie、ローカル専用メモ、provider raw errorが含まれていないことを手動で確認しました。

## この記録に含めない範囲

- setup時点の`vectorCount`は`0`でした。
- 手動upsert後の後続確認では、より大きい`vectorCount`を記録する可能性があります。
- このsetup証跡は検索品質を証明するものではありません。
- 検索品質は、小さな実Vectorize確認とretrieval eval証跡で別途測定する必要があります。
- Claude answer generationは、retrieval確認後に別途測定する必要があります。
