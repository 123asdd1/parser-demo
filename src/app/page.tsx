"use client";

import { AppProps } from "next/app";
import Head from "next/head";
import {
  Container,
  AppShell,
  Header,
  useMantineTheme,
  Burger,
  Title,
  Grid,
  Box,
} from "@mantine/core";

function MainContent() {
  const theme = useMantineTheme();

  return (
    <Container size="xl" style={{ paddingTop: 50 }}>
      <Grid gutter={100}>
        <Grid.Col span={6}>
          <Box>
            <Title ta="center" order={2}>
              Parser
            </Title>
            <Box mt="lg" bg="gray.2" h={100}></Box>
          </Box>
        </Grid.Col>
        <Grid.Col span={6}>
          <Box>
            <Title ta="center" order={2}>
              Alchemy built-in
            </Title>
            <Box mt="lg" bg="gray.2" h={100}></Box>
          </Box>
        </Grid.Col>
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
