"use client";

import Head from "next/head";
import {
  Container,
  AppShell,
  Header,
  useMantineTheme,
  Title,
  Grid,
  Box,
  Button,
  Text,
  Center,
  Anchor,
  Group,
} from "@mantine/core";
import { useEffect, useState } from "react";
import Decimal from "decimal.js";

const ALCHEMY_URL =
  "https://eth-mainnet.g.alchemy.com/v2/Ak-Ms3fpmNR8Nw58PithubP1ROQFAnbL";

const CRYPTO_PUNKS_ADDRESS = "0xb47e3cd837ddf8e4c57f05d70ab865de6e193bbb";
const WRAPPED_PUNKS_ADDRESS = "0xb7f7f6c52f2e2fdb1963eab30438024864c313f6";

const contracts = {
  CryptoPunks: CRYPTO_PUNKS_ADDRESS,
  WrappedPunks: WRAPPED_PUNKS_ADDRESS,
};

const parser: Record<string, (log: any) => Promise<CacheLog | undefined>> = {
  [CRYPTO_PUNKS_ADDRESS]: async (log: any) => {
    const { topics, data, blockNumber, transactionHash } = log;

    if (
      topics[0] !==
      "0x05af636b70da6819000c49f85b21fa82081c632069bb626f30932034099107d8"
    )
      return;

    const [, from, to] = topics;

    const fromAddress = `0x${from.slice(26)}`;
    const toAddress = `0x${to.slice(26)}`;
    const punkId = new Decimal(data).toFixed();

    return {
      parserTime: new Date(),
      blockNumber: new Decimal(blockNumber).toFixed(),
      fromAddress,
      toAddress,
      punkId,
      contract: "CryptoPunks",
      hash: transactionHash,
    };
  },
  [WRAPPED_PUNKS_ADDRESS]: async (log: any) => {
    const { topics, blockNumber, transactionHash } = log;

    if (
      topics[0] !==
      "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef"
    )
      return;

    const [, from, to] = topics;
    const fromAddress = `0x${from.slice(26)}`;
    const toAddress = `0x${to.slice(26)}`;
    const punkId = new Decimal(topics[3]).toFixed();

    return {
      parserTime: new Date(),
      blockNumber: new Decimal(blockNumber).toFixed(),
      fromAddress,
      toAddress,
      punkId,
      contract: "WrappedPunks",
      hash: transactionHash,
    };
  },
};

async function post(
  method: string,
  params?: Record<string, unknown> | Array<unknown>
) {
  const res = await fetch(ALCHEMY_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method,
      ...(params && { params }),
    }),
  });

  if (!res.ok) throw new Error(await res.text());

  const json = (await res.json()) as {
    jsonrpc: string;
    id: number;
    result: unknown;
  };

  return json.result;
}

async function getLatestBlockNumber() {
  return new Decimal((await post("eth_blockNumber")) as string).toFixed();
}

async function getLogs(
  addresses: Array<string>,
  fromBlock: string,
  toBlock: string,
  topics: Array<string> | Array<Array<string>>
) {
  return post("eth_getLogs", [
    {
      address: addresses,
      fromBlock: new Decimal(fromBlock).toHex(),
      toBlock: new Decimal(toBlock).toHex(),
      topics,
    },
  ]);
}

interface Cache {
  latestBlockNum: string;
  curBlockNum: string;
  logs: CacheLog[];
}

interface CacheLog {
  parserTime: Date;
  blockNumber: string;
  fromAddress: string;
  toAddress: string;
  punkId: string;
  contract: string;
  hash: string;
}

async function checkBlock(props: {
  cache: Cache;
  setCache: (obj: Cache) => void;
}) {
  const { setCache, cache } = props;

  console.log("Checking for new block...");
  const blockNumber = await getLatestBlockNumber();
  const newCache = {
    ...cache,
    latestBlockNum: blockNumber,
  };

  if (
    newCache.curBlockNum &&
    newCache.latestBlockNum &&
    newCache.latestBlockNum > newCache.curBlockNum
  ) {
    const logs = (await getLogs(
      Object.values(contracts),
      newCache.curBlockNum,
      newCache.latestBlockNum,
      [
        [
          "0x05af636b70da6819000c49f85b21fa82081c632069bb626f30932034099107d8",
          "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
        ],
      ]
    )) as Array<unknown>;

    for (const log of logs) {
      const { address } = log as { address: string };
      if (!parser[address]) continue;

      const parsedLog = await parser[address](log);
      if (!parsedLog) continue;

      newCache.logs = [...(newCache.logs || []), parsedLog];
    }

    console.log(
      `Found ${newCache.logs.length} new logs from block ${blockNumber} to ${newCache.curBlockNum}.`
    );

    newCache.curBlockNum = newCache.latestBlockNum;
  }

  if (!newCache.curBlockNum) {
    newCache.curBlockNum = newCache.latestBlockNum;
  }

  setCache(newCache);
}

async function monitorTransfers() {}

function viewDetail(props: {
  opened: boolean;
  setOpened: (opened: boolean) => void;
}) {
  const { opened, setOpened } = props;

  if (!opened) {
  }

  setOpened(!opened);
}

function truncate(str: string) {
  return str.slice(0, 10) + "...";
}

function MainContent() {
  const theme = useMantineTheme();
  const [opened, setOpened] = useState(false);
  const [cache, setCache] = useState<Cache>({
    latestBlockNum: "0",
    curBlockNum: "",
    logs: [],
  });

  useEffect(() => {
    const intervalId = setInterval(() => checkBlock({ cache, setCache }), 1000);

    return () => clearInterval(intervalId);
  }, [cache]);

  return (
    <Container size="md" style={{ paddingTop: 50 }}>
      <Grid>
        <Grid.Col span={12} mb="lg">
          <Box
            style={{
              border: `1px solid ${theme.colors.blue[3]}`,
            }}
            bg="blue.2"
            py="xs"
          >
            <Center>
              <Title order={4}>Latest confirm block</Title>
            </Center>
            <Center>
              <Text>{cache.latestBlockNum}</Text>
            </Center>
          </Box>
        </Grid.Col>
      </Grid>
      <Grid gutter={100}>
        <Grid.Col span={12}>
          <Box>
            <Title ta="center" order={2}>
              Parser
            </Title>
            <Box
              style={{
                border: `1px solid ${theme.colors.gray[4]}`,
                flexDirection: "column-reverse",
                display: "flex",
              }}
              mt="lg"
              bg="gray.2"
              p="xs"
              mih={100}
            >
              {cache.logs.length === 0 && (
                <Center>
                  <Text>Waiting for new transfers...</Text>
                </Center>
              )}
              {cache.logs.map((log, i) => (
                <Box
                  style={{
                    border: `1px solid ${theme.colors.gray[4]}`,
                  }}
                  bg="gray.1"
                  p="xs"
                  mb="xs"
                  onClick={() => {}}
                  key={i}
                >
                  <Group position="apart">
                    <Box>
                      [{log.parserTime.toUTCString()}]{" "}
                      {log.contract === "WrappedPunks"
                        ? log.fromAddress ===
                          "0x0000000000000000000000000000000000000000"
                          ? log.fromAddress.slice(0, 10) +
                            "... minted " +
                            `${log.contract} #${log.punkId} to`
                          : log.toAddress.slice(0, 10) +
                            "... burned " +
                            `${log.contract} #${log.punkId} to`
                        : `${truncate(log.fromAddress)} transfer punk #${
                            log.punkId
                          } to ${truncate(log.toAddress)}`}
                    </Box>
                    <Anchor
                      href={`https://etherscan.io/tx/${log.hash}`}
                      target="_blank"
                      key={i}
                      style={{
                        textDecoration: "none",
                        color: theme.colors.dark[9],
                      }}
                    >
                      <Button size="xs" variant="outline">
                        View
                      </Button>
                    </Anchor>
                  </Group>
                </Box>
              ))}
            </Box>
          </Box>
        </Grid.Col>
        {/* <Grid.Col span={6}>
          <Box>
            <Title ta="center" order={2}>
              Alchemy built-in
            </Title>
            <Box
              style={{
                border: `1px solid ${theme.colors.gray[4]}`,
              }}
              mt="lg"
              bg="gray.2"
              h={100}
            ></Box>
          </Box>
        </Grid.Col> */}
      </Grid>
    </Container>
  );
}

export default function Home() {
  const theme = useMantineTheme();

  return (
    <>
      <Head>
        <title>Page title</title>
        <meta
          name="viewport"
          content="minimum-scale=1, initial-scale=1, width=device-width"
        />
      </Head>

      <AppShell
        styles={{
          main: {
            background:
              theme.colorScheme === "dark"
                ? theme.colors.dark[8]
                : theme.colors.gray[0],
          },
        }}
        navbarOffsetBreakpoint="sm"
        asideOffsetBreakpoint="sm"
        header={
          <Header height={{ base: 50, md: 70 }} p="md">
            <div
              style={{
                display: "flex",
                alignItems: "center",
                height: "100%",
                justifyContent: "center",
              }}
            >
              <Title order={1}>Parser Demo</Title>
            </div>
          </Header>
        }
      >
        <MainContent />
      </AppShell>
    </>
  );
}
