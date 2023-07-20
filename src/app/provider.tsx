"use client";

import { MantineProvider } from "@mantine/core";
import { AppProps } from "next/app";

const Provider = (props: AppProps) => {
  const { Component, pageProps } = props;

  return (
    <MantineProvider withGlobalStyles withNormalizeCSS>
      <Component {...pageProps} />
    </MantineProvider>
  );
};

export default Provider;
