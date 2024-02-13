"use client"

import React, { useEffect, useState } from 'react'
import * as nearAPI from "near-api-js"

// wallet selector modal ui
import '@near-wallet-selector/modal-ui/styles.css'
import { setupModal } from '@near-wallet-selector/modal-ui'

// wallet selector
import { setupWalletSelector } from '@near-wallet-selector/core'
import { setupLedger } from '@near-wallet-selector/ledger'
import { setupMyNearWallet } from '@near-wallet-selector/my-near-wallet'

// note this is different from prior NextJS versions of router from "next/router"
import { useRouter } from "next/navigation"

const NETWORK = process.env.NEXT_PUBLIC_NETWORK || 'testnet'
const CONTRACT_ID = process.env.NEXT_PUBLIC_CONTRACT_NAME || 'cna.mike.testnet'

export default function HomePage() {
    // todo we wanna use this
    const [nearProvider, setNearProvider] = useState(null)
    const [wallet, setWallet] = useState(null)
    const [walletSelector, setWalletSelector] = useState(null)
    // Would be cool to setContract based on URL params.
    const [contract, setContract] = useState(CONTRACT_ID)
    const [isSignedIn, setIsSignedIn] = useState(false)
    const [accountId, setAccountId] = useState("")
    const [walletSelectorModal, setWalletSelectorModal] = useState(null)
    // note: this isn't from "next/router" but instead "next/navigation"
    const router = useRouter()

    // on load (zero deps)
    useEffect(() => {
        const start = async () => {
            const walletSelector = await setupWalletSelector({
                network: NETWORK,
                modules: [
                    // todo: add wallet connect setup here
                    setupMyNearWallet(),
                    setupLedger()
                ],
            })

            const currentlySignedIn = walletSelector.isSignedIn()
            setIsSignedIn(currentlySignedIn)

            const modal = setupModal(walletSelector, {
                    contractId: contract
                }
            )
            setWalletSelectorModal(modal)
            if (!currentlySignedIn) {
                console.log('User not logged in.')
                return
            }

            // The user is logged in at this point
            console.log('User logged in.')
            const walletSelectorStore = walletSelector.store.getState()
            const accounts = walletSelectorStore.accounts
            setWalletSelector(walletSelector)
            const wallet = await walletSelector.wallet()
            setWallet(wallet)
            const options = walletSelector.options
            const accountId = accounts[0].accountId
            setAccountId(accountId)

            const publicKey = accounts[0].publicKey
            const nodeUrl = options.network.nodeUrl

            const provider = new nearAPI.providers.JsonRpcProvider({
                url: nodeUrl
            })

            // So we can use it later
            setNearProvider(provider)

            // we'll see if the access key still exists
            // if it doesn't exist, it'll throw an error, hence try catch
            // some day monads will rule the world
            try {
                await provider.query({
                    request_type: "view_access_key",
                    finality: "final",
                    account_id: accountId,
                    public_key: publicKey,
                })

                // So I guess you don't do anything if it succeeds.
            } catch (e) {
                // Quite a bummer to have to handle errors like this. Onward.
                // This too shall pass.
                if (e.toString().includes(`access key ${publicKey} does not exist while viewing`)) {
                    console.log('Access key not on account, removing…')
                    // so seems like the key will persist here, so we'll manually remove it from local storage after calling the wallet.signOut, which we can't rely on for full removal, at least for MNW that i've been testing
                    const keyStore = new nearAPI.keyStores.BrowserLocalStorageKeyStore()
                    console.log('keyStore', keyStore)
                    await wallet.signOut()

                    // This method works fine if it's not found, btw.
                    await keyStore.removeKey(NETWORK, accountId)
                    console.log('Access key removed.')
                    // Reset dem state vars
                    setAccountId(null)
                    setIsSignedIn(false)
                } else {
                    console.error('Unexpected access key error. Tell @mikedotexe', e)
                }
            }
        }

        // this removes the squigglies
        start().then(() => {})
    }, [setupWalletSelector])

    const showWalletSelectorModal = () => {
        const hackToFixUrlParams = async () => {
            if (typeof window !== "undefined") {
                const url = new URL(window.location)
                console.log('aloha current window local url', url)
                await router.replace(url.origin)
            }

            // after fixing the URL params, we can show the modal.
            // i don't know why yet, or if it's me, but might be a wallet selector issue.
            walletSelectorModal?.show()
        }

        hackToFixUrlParams().then(() => {})
    }

    // We're signing out the responsible way, by deleting the access key,
    // but only after we return back, check that the key is no longer valid
    const signOut = async () => {
        if (!wallet) {
            console.warn("No wallet connected, sir.")
            return
        }

        let publicKey
        try {
            const accounts = await wallet.getAccounts()
            if (accounts.length > 0) {
                publicKey = accounts[0].publicKey
                console.log("Public Key of the logged-in user:", publicKey)
            } else {
                console.warn("No accounts found")
            }
        } catch (error) {
            console.error("Failed to retrieve account details:", error)
        }

        if (publicKey) {
            setWallet(null)
            setAccountId("")
            setIsSignedIn(false)

            await wallet.signAndSendTransaction({
                receiverId: accountId,
                // For now it seems you must memorize the Actions and their objects,
                // but there are types! Good reference for non-TypeScript folks:
                // https://github.com/near/wallet-selector/blob/fb0ee241ed1d700da9c46c21ae4107172651bd73/packages/core/src/lib/wallet/transactions.types.ts
                actions: [{
                    type: "DeleteKey",
                    params: {
                        publicKey
                    }
                }]
            })
        }
    }

    return (
        <main>
            <div style={{textAlign: 'center'}}>
                <h1>Staking without BOS</h1>
                <div>
                    {isSignedIn ? (
                        <button onClick={signOut}>
                            Log out
                        </button>
                    ): (
                        <button onClick={showWalletSelectorModal}>
                            Login
                        </button>
                    )}
                </div>
            </div>
        </main>
    )
}
