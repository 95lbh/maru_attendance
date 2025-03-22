// pages/_app.tsx
import "../styles/globals.css";
import type { AppProps } from "next/app";
import Layout from "../components/Layout";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <Layout>
      <Component {...pageProps} />
    </Layout>
  );
}

// import "@/styles/globals.css";
// import '../styles/globals.css'; // 이 줄 있어야 Tailwind 작동함

// import type { AppProps } from "next/app";

// export default function App({ Component, pageProps }: AppProps) {
//   return <Component {...pageProps} />;
// }
