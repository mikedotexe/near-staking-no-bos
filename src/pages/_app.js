import Head from 'next/head';
import '../../public/global.css';

function MyApp({ Component, pageProps }) {
    return (
        <>
            <Head>
                <link rel="icon" href="favicon.png" />
            </Head>
            <Component {...pageProps} />
        </>
    );
}

export default MyApp;
