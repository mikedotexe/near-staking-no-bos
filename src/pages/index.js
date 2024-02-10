// src/pages/index.js
import React, { useEffect, useState } from 'react';
import { Wallet } from './near-wallet'; // Adjust the import path as necessary
import { Contract } from './near-interface'; // Adjust the import path as necessary
// import '../assets/global.css'; // Adjust the import path as necessary

const contractId = "cna.mike.testnet" //process.env.NEXT_PUBLIC_CONTRACT_NAME; // Use NEXT_PUBLIC_ prefix for env vars to expose them to the browser
function SignOutButton({accountId, onClick}) {
    return (
        <button style={{ float: 'right' }} onClick={onClick}>
            Sign out {accountId}
        </button>
    );
}

function EducationalText() {
    return (
        <>
            <p>Look at that! A Hello World app! This greeting is stored on the NEAR blockchain. Check it out:</p>
            {/* Content shortened for brevity */}
            <p>To keep learning, check out <a target="_blank" rel="noreferrer" href="https://docs.near.org">the NEAR docs</a> or look through some <a target="_blank" rel="noreferrer" href="https://examples.near.org">example apps</a>.</p>
        </>
    );
}

export default function HomePage() {
    const [wallet, setWallet] = useState();
    const [contract, setContract] = useState();
    const [isSignedIn, setIsSignedIn] = useState(false);
    const [valueFromBlockchain, setValueFromBlockchain] = useState();
    const [uiPleaseWait, setUiPleaseWait] = useState(true);

    useEffect(() => {
        const initWallet = new Wallet({contractId});
        const initContract = new Contract({wallet: initWallet});

        initWallet.startUp().then((signedIn) => {
            setIsSignedIn(signedIn);
            setWallet(initWallet);
            setContract(initContract);
            if (signedIn) {
                initContract.getGreeting()
                    .then(setValueFromBlockchain)
                    .catch(alert)
                    .finally(() => setUiPleaseWait(false));
            } else {
                setUiPleaseWait(false);
            }
        }).catch(e => {
            console.error(e);
            alert(`Error: ${e.message}`);
        });
    }, []);

    const changeGreeting = async (e) => {
        e.preventDefault();
        setUiPleaseWait(true);
        const greetingInput = e.target.elements.greetingInput.value;

        try {
            await contract.setGreeting(greetingInput);
            const newGreeting = await contract.getGreeting();
            setValueFromBlockchain(newGreeting);
        } catch (error) {
            alert(error);
        } finally {
            setUiPleaseWait(false);
        }
    };

    if (!isSignedIn) {
        return (
            <main>
                <h1>Staking without BOS</h1>
                <p style={{textAlign: 'center'}}>
                    <button onClick={() => wallet.signIn()}>Login</button>
                </p>
            </main>
        );
    }

    return (
        <>
            <SignOutButton accountId={wallet.accountId} onClick={() => wallet.signOut()}/>
            <main className={uiPleaseWait ? 'please-wait' : ''}>
                <h1>The contract says: <span className="greeting">{valueFromBlockchain}</span></h1>
                <form onSubmit={changeGreeting} className="change">
                    {/* Form content shortened for brevity */}
                </form>
                <EducationalText/>
            </main>
        </>
    );
}
