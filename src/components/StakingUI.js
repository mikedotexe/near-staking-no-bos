import ProgressBar from "@/components/ProgressBar";
import {useState, useEffect, useMemo, useCallback, useContext} from "react";
import { mainnetValidators } from "@/components/getValidators"
import * as nearAPI from "near-api-js"

import WalletContext from '@/contexts/WalletContext';

export const StakingUI = ({accountId, provider, accountConn}) => {
    if (!accountId || !provider || !accountConn) return

    const { wallet } = useContext(WalletContext);

    const yoctoZeroes = "000000000000000000000000";

    const [modalAmount, setModalAmount] = useState(`42${yoctoZeroes}`);

    const makeYoctoReadable = (amount) => {
        // Chop off the yoctos basically, make it whole NEAR
        const formattedNear = parseInt(nearAPI.utils.format.formatNearAmount(amount))
        return (formattedNear < 1) ? "(less than 1)" : formattedNear
    };

    const yoctoToNear = (yocto) => nearAPI.utils.format.formatNearAmount(yocto, 3);

    const nearToYocto = (near) => {
        let newAmount = nearAPI.utils.format.parseNearAmount(near)
        // it has rounding problems where like 0 NEAR will come back as 1 yocto
        return (newAmount === null || newAmount === "1") ? "0" : newAmount
    };


    const StakeUnstakeWithdraw = ({validator, method, amount}) => {
        const saneDefaultAmount = amount === "1" ? "0" : amount
        const [yoctoAmount, setYoctoAmount] = useState(saneDefaultAmount);

        const handleCancel = () => {
            // eventually add fade-out effect
            setShowStakingModal(false);
        };
        const handleUnstake = async (validatorAddress) => {
            console.log("Unstaking…", {validatorAddress, yoctoAmount});
            await wallet.signAndSendTransaction({
                receiverId: validatorAddress,
                actions: [{
                    type: "FunctionCall",
                    params: {
                        methodName: "unstake",
                        args: { amount: yoctoAmount },
                        gas: "30000000000000",
                        deposit: "0",
                    }
                }]
            })
        };
        const handleStake = async (validatorAddress) => {
            console.log("Staking…", {validatorAddress, yoctoAmount});
            await wallet.signAndSendTransaction({
                receiverId: validatorAddress,
                actions: [{
                    type: "FunctionCall",
                    params: {
                        methodName: "deposit_and_stake",
                        args: { amount: yoctoAmount },
                        gas: "30000000000000",
                        deposit: yoctoAmount,
                    }
                }]
            })
        };
        const handleWithdraw = async (validatorAddress) => {
            console.log("Withdrawing…", {validatorAddress, yoctoAmount});
            await wallet.signAndSendTransaction({
                receiverId: validatorAddress,
                actions: [{
                    type: "FunctionCall",
                    params: {
                        methodName: "withdraw",
                        args: { amount: yoctoAmount },
                        gas: "30000000000000",
                        deposit: "0",
                    }
                }]
            })
        };

        const containerStyle = {
            boxShadow: "0 3px 6px rgba(0, 0, 0, 0.6)",
            border: "3px solid #f2f1e9",
            backgroundColor: "rgba(0, 0, 0, .7)",
            background:
                "radial-gradient(circle at center, rgba(255, 255, 255, 0.7), rgba(0, 0, 0, 0.7) 100%), radial-gradient(circle at 10% 90%, rgba(200, 200, 255, 0.8), transparent 60%),radial-gradient(circle at 50% 50%, rgba(151, 151, 255, 0.7), transparent 50%)",
            padding: "20px",
            width: "100%",
            margin: "0 auto",
            borderRadius: "13px",
            overflow: "auto",
            display: "flex",
            flexDirection: "column",
            transition: "opacity 0.3s ease-out",
        };

        const titleStyle = {
            textAlign: "center",
            color: "#f2f1e9",
            marginBottom: "6px",
            textShadow: `
            -1px -1px 0 #000,
            1px -1px 0 #000,
            -1px 1px 0 #000,
            1px 1px 0 #000`,
            letterSpacing: "1px",
        };

        return (
            <div style={containerStyle}>
                <h2 style={titleStyle}>{method} NEAR</h2>
                {method === "stake" ? (
                    <div>
                        <input
                            key="modalAmountStake"
                            autoFocus={true}
                            defaultValue={yoctoToNear(modalAmount)}
                            onChange={(e) => {
                                const nearAmount = e.target.value
                                const yoctoAmount = nearToYocto(nearAmount)
                                setYoctoAmount(yoctoAmount || "0")
                            }}
                            style={{
                                padding: "13px",
                                width: "80%",
                                margin: "13px auto",
                                display: "block",
                            }}
                        />
                        <div style={{textAlign: "center", color: "black"}}><span>(Whole NEAR values)</span></div>
                        <div style={{textAlign: "center", color: "black", fontSize: ".73em"}}><span>({yoctoAmount} yocto)</span></div>
                    </div>
                ) : (
                    <div>
                        <input
                            key="modalAmountNotStake"
                            autoFocus={true}
                            defaultValue={yoctoToNear(modalAmount)}
                            onChange={(e) => {
                                const nearAmount = e.target.value
                                const yoctoAmount = nearToYocto(nearAmount)
                                setYoctoAmount(yoctoAmount || "0")
                            }}
                            style={{
                                padding: "13px",
                                width: "80%",
                                margin: "13px auto",
                                display: "block",
                            }}
                        />
                        <div style={{textAlign: "center", color: "black"}}><span>(Whole NEAR values)</span></div>
                        <div style={{textAlign: "center", color: "black", fontSize: ".73em"}}>
                            <span>({yoctoAmount} yocto)</span>
                        </div>
                    </div>
                )}
                <button
                    onClick={(e) => {
                        if (method === "unstake") {
                            handleUnstake(validator);
                        } else if (method === "stake") {
                            // Assuming you have a function handleStake for the "stake" action
                            handleStake(validator);
                        } else if (method === "withdraw") {
                            handleWithdraw(validator);
                        }
                    }}
                    style={{padding: "13px", margin: "13px auto", display: "block"}}
                >
                    <span style={{
                        textTransform: "capitalize",
                    }}>{method}</span>
                </button>
                <button
                    onClick={handleCancel}
                    style={{padding: "13px", margin: "13px auto", display: "block"}}
                >Cancel</button>
            </div>
        );
    };

    const walletUnstake = useCallback(({validator, amount}) => {
        setModalAmount(amount)
        console.log('walletUnstake validator, amount', {validator, amount});
        setStakingModalData(prevState => ({ ...prevState, validator, method: "unstake", amount }));
        setShowStakingModal(true);
    }, []);

    const walletWithdraw = useCallback(({validator, amount}) => {
        setModalAmount(amount)
        console.log('walletWithdraw validator, amount', {validator, amount});
        setStakingModalData(prevState => ({ ...prevState, validator, method: "withdraw", amount }));
        setShowStakingModal(true);
    }, []);

    const walletStake = useCallback(({validator, amount}) => {
        setModalAmount(amount)
        setStakingModalData(prevState => {
            return ({ ...prevState, validator, method: "stake", amount })
        });
        setShowStakingModal(true);
    }, []);

    // State initialization
    const [progressVal, setProgressVal] = useState(10);
    // 219 validators, sending at least two messages, sometimes a third.
    // this sane starting place helps so the progress bar doesn't jump around
    const [progressMax, setProgressMax] = useState(210);
    const [validatorStakingDetails, setValidatorStakingDetails] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showStakingModal, setShowStakingModal] = useState(false);
    const [stakingModalData, setStakingModalData] = useState({validator: "polkachu.poolv1.near", method: "unstake", amount: `1${yoctoZeroes}`});

    function createValidatorQueries(validators) {
        if (!accountId) return;
        let progressCounter = 0;

        const updateProgress = (amount) => {
            if (amount) {
                if (amount === 0) amount = 1;
                progressCounter = progressCounter + amount;
                if (progressCounter > progressVal) {
                    setProgressVal(progressCounter);
                }
            }

        };

        const wrappedPromises = validators.map((validatorAddress) => {
            // set up two promises for each
            const stakedBalancePromise = accountConn.viewFunction({
                contractId: validatorAddress,
                methodName: "get_account_staked_balance",
                args: { account_id: accountId },
                blockQuery: {finality: "final"}
            })

            const unstakedBalancePromise = accountConn.viewFunction({
                contractId: validatorAddress,
                methodName: "get_account_unstaked_balance",
                args: { account_id: accountId },
                blockQuery: {finality: "final"}
            })

            return Promise.all([stakedBalancePromise, unstakedBalancePromise])
                .then(([stakedBalance, unstakedBalance]) => {
                    // console.log('stakedBalance', stakedBalance)
                    // console.log('unstakedBalance', unstakedBalance)

                    const isHighlight = (unstakedBalance > 0) || (stakedBalance > 0);
                    if (unstakedBalance > 0) {
                        // if unstaked balance is positive, check if it's available, adding another Promise
                        return accountConn.viewFunction({
                            contractId: validatorAddress,
                            methodName: "is_account_unstaked_balance_available",
                            args: { account_id: accountId },
                        }).then((isAvailable) => {
                            updateProgress(1);
                            return {
                                validatorAddress,
                                stakedBalance,
                                stakedBalanceWholeNums: makeYoctoReadable(stakedBalance),
                                unstakedBalance,
                                unstakedBalanceWholeNums: makeYoctoReadable(unstakedBalance),
                                isHighlight,
                                isUnstakedBalanceAvailable: isAvailable,
                            };
                        });
                    } else {
                        // If not, just return the balances
                        updateProgress(1);
                        return {
                            validatorAddress,
                            stakedBalance,
                            unstakedBalance,
                            isHighlight,
                            isUnstakedBalanceAvailable: null,
                        };
                    }
                })
                .catch((err) => {
                    console.error(
                        "Error fetching balances for ",
                        validatorAddress,
                        ": ",
                        err
                    );
                    updateProgress(1);
                    return null;
                });
        });

        // Execute all of them
        Promise.all(wrappedPromises)
            .then((results) => {
                const detailedStakingInfo = results.filter((info) => {
                    return info !== null;
                });
                setValidatorStakingDetails(detailedStakingInfo);
                // intentionally not setting IsLoading here, the UI needs to finish
            })
            .catch((err) => {
                console.error("Error with promise all: ", err);
                setIsLoading(false);
            });
    }

    // onLoad useEffect
    useEffect(() => {
        // We need this check here again
        if (!!!mainnetValidators) return;

        mainnetValidators.getAddresses({}).then((vals) => {
            setProgressMax(vals.length);
            createValidatorQueries(vals);
        });
    }, []);

    useEffect(() => {
        if (progressVal >= progressMax) {
            // Compare these two approaches by commenting them out, it's interesting.

            // this works here but not in the VM, interesting
            setIsLoading(false);
            // const timer = setTimeout(() => setIsLoading(false), 3000);
            // return () => clearTimeout(timer);
        }
    }, [progressVal, progressMax]);

    const LoadingModal = () => {
        // This helps with the flash of red if it hasn't loaded yet
        if (!!!ProgressBar) {
            return <></>;
        } else {
            if (!accountId) {
                console.warn("accountId is not ready yet");
                return;
            }

            return (
                <div
                    style={{
                        position: "fixed",
                        top: "50%",
                        left: "50%",
                        transform: "translate(-50%, -150%)",
                        padding: "6px",
                        width: "19%",
                        height: "13%",
                        backgroundColor: "rgba(0, 0, 0, 0.2)",
                        backdropFilter: "blur(6px)",
                        display: isLoading ? "flex" : "none",
                        justifyContent: "center",
                        alignItems: "center",
                        borderRadius: "300px",
                        transition: "opacity 0.2s ease-out, background-color 0.2s ease",
                        opacity: isLoading ? 1 : 0,
                        zIndex: 999,
                        background: `linear-gradient(to bottom, rgba(255, 255, 255, 0) 0%, rgba(0, 0, 0, 0.2) 100%)`,
                        boxShadow: "0 9px 9px 0 rgba(255, 255, 255, 0.37)",
                    }}
                >
                    <ProgressBar key={progressVal} value={progressVal} max={progressMax}/>
                </div>
            );
        }
    };

    const stakingModalDisplayStyles = {
        display: showStakingModal ? "flex" : "none",
        opacity: showStakingModal ? 1 : 0,
    };

    const StakeUnstakeWithdrawModal = ({modalAmount}) => {
        if (!StakeUnstakeWithdraw) {
            return <></>;
        } else {
            const handleOutsideClick = (e) => {
                setShowStakingModal(false);
            };

            const outerDivStyle = {
                position: "fixed",
                top: "6%",
                left: 0,
                width: "100%",
                backgroundImage: "radial-gradient(ellipse, rgba(0, 0, 0, 0.3) 66%, transparent 80%)",
                display: "flex",
                justifyContent: "center",
                zIndex: 998,
                cursor: "pointer",
                ...stakingModalDisplayStyles,
            };

            const innerDivStyle = {
                cursor: "auto",
                position: "relative",
                width: "37%",
                height: "auto",
                overflowY: "hidden",
                padding: "1%",
                background: "radial-gradient(ellipse, rgba(151, 151, 255, .8) 19%, rgba(0, 0, 0, 0.8) 100%)",
                borderRadius: "13px",
                boxShadow: "0 0 15px rgba(255, 255, 255, 0.6), 0 0 20px rgba(255, 255, 255, 0.4), 0 0 25px rgba(255, 255, 255, 0.3), 0 0 30px rgba(255, 255, 255, 0.2), 0 0 35px rgba(255, 255, 255, 0.1), 0 0 40px rgba(255, 255, 255, 0.05)",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
            };

            return (
                <div style={outerDivStyle} onClick={handleOutsideClick}>
                    <div style={innerDivStyle} onClick={(e) => e.stopPropagation()}>
                        {stakingModalData && modalAmount && showStakingModal ? (
                            <StakeUnstakeWithdraw
                                validator={stakingModalData.validator}
                                method={stakingModalData.method}
                                amount={modalAmount}
                            />
                        ) : (
                          <p>mike purvis</p>
                        )}
                    </div>
                </div>
            );
        }
    };

    // below is likely helpful to keep in for debugging, at least for a bit
    // console.log('validatorStakingDetails', validatorStakingDetails)

    const highlightedRows = useMemo(
        () => validatorStakingDetails.filter(row => row && row?.isHighlight),
        [validatorStakingDetails]
    );
    // console.log('highlightedRows', highlightedRows)
    const rangedRows = useMemo(
        () => validatorStakingDetails.filter(row => row && !row?.isHighlight),
        [validatorStakingDetails]
    );
    // console.log('rangedRows', rangedRows)


    if (!accountId) {
        return (
            <div>
                <p>Please login.</p>
            </div>
        );
    } else {
        return (
            <div style={{
                position: "relative",
                width: "100%",
                filter: "contrast(166%)",
            }}>
                <div
                    style={{
                        fontFamily: "'Lucida Console', Monaco, monospace",
                        padding: "13px 16px",
                        maxWidth: "900px",
                        margin: "0 auto",
                        background: `radial-gradient(circle at top right, slategray, transparent 80%), 
                         radial-gradient(circle at center, darkslategray, transparent 83%)`,
                        backgroundImage: 'url("data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz48c3ZnIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgd2lkdGg9IjEwMCIgaGVpZ2h0PSIxMDAiPjxkZWZzPjxmaWx0ZXIgaWQ9InNsYXRlTm9pc2UiIHg9Ii01MCUiIHk9Ii01MCUiIHdpZHRoPSIyMDAlIiBoZWlnaHQ9IjIwMCUiPjxmZVR1cmJ1bGVuY2UgdHlwZT0iZnJhY3RhbE5vaXNlIiBiYXNlRnJlcXVlbmN5PSIxLjkiIG51bU9jdGF2ZXM9IjYiIHJlc3VsdD0ibm9pc2UiLz48ZmVHYXVzc2lhbkJsdXIgaW49Im5vaXNlIiBzdGREZXZpYXRpb249IjIiIHJlc3VsdD0iYmx1cnJlZE5vaXNlIi8+PGZlQ29tcG9uZW50VHJhbnNmZXIgaW49InNsYXRlTm9pc2UiPjxmZUZ1bmNSIHR5cGU9ImxpbmVhciIgc2xvcGU9IjAuOSIgaW50ZXJjZXB0PSIwLjA1Ii8+PGZlRnVuY0cgdHlwZT0ibGluZWFyIiBzbG9wZT0iMC45IiBpbnRlcmNlcHQ9IjAuMDUiLz48ZmVGdW5jQiB0eXBlPSJsaW5lYXIiIHNsb3BlPSIwLjk1IiBpbnRlcmNlcHQ9IjAuMSIvPjwvZmVDb21wb25lbnRUcmFuc2Zlcj48L2ZpbHRlcj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsdGVyPSJ1cmwoI3NsYXRlTm9pc2UpIiBmaWxsPSJkYXJrZ3JheSIgLz48L3N2Zz4=")',
                        backgroundBlendMode: "hard-light",
                        borderRadius: "16px 16px 0 0",
                        filter: "saturate(6) grayscale(6%)",
                    }}
                >
                    <LoadingModal/>
                    <StakeUnstakeWithdrawModal modalAmount={modalAmount} />
                    <h1 style={{
                        textAlign: "center",
                        color: "#f2f1e9",
                        textShadow: `-1px -1px 0 #000,1px -1px 0 #000,-1px 1px 0 #000,3px 3px 3px #000`,
                        letterSpacing: "6px",
                        textTransform: "uppercase",
                    }}>Staking</h1>
                    <div>
                        <div>
                            <div style={{
                                background: "radial-gradient(circle at top left, rgba(0, 0, 0, 0.6) 30%, rgba(0, 0, 0, 0.2) 70%)",
                                filter: "drop-shadow(3px 3px 3px rgba(255, 255, 255, 0.6)",
                                backdropFilter: "contrast(0.1)",
                                padding: "10px",
                                margin: "auto",
                                marginBottom: "13px",
                                color: "#fff",
                                borderRadius: "6px",
                            }}>
                                <h3>Active</h3>
                                <div
                                    className="faux-table"
                                    style={{
                                        display: "flex",
                                        flexDirection: "column",
                                        margin: "6px 0",
                                        borderRadius: "6px",
                                        boxShadow: "0 0 1px 0 #f2f1e9",
                                    }}
                                >
                                    <div
                                        style={{
                                            display: "flex",
                                            flexDirection: "column",
                                        }}
                                    >
                                        <div
                                            className="faux-table-header"
                                            style={{
                                                display: "flex",
                                                borderRadius: "6px 6px 0 0",
                                                background: "#000",
                                                color: "#f2f1e9",
                                                textTransform: "uppercase",
                                                padding: "9px",
                                                fontSize: "1.3em",
                                            }}
                                        >
                                            <div style={{flex: 2, padding: "0 10px"}}>Validator</div>
                                            <div style={{flex: 2, padding: "0 10px"}}>Staked</div>
                                            <div style={{flex: 2, padding: "0 10px"}}>Unstaked</div>
                                        </div>
                                        <div
                                            style={{
                                                height: "6px",
                                                background: "linear-gradient(to right, #00ec97, #fff, #00ec97)",
                                                filter: "saturate(13%)",
                                            }}
                                        />
                                    </div>
                                    {highlightedRows.length && highlightedRows.map((detail) => {
                                        // console.log('highlightedRows detail', detail)
                                        return (
                                            <div
                                                key={detail.validatorAddress}
                                                className="faux-table-row"
                                                style={{
                                                    display: "flex",
                                                    background: "#111",
                                                    color: "#fff",
                                                    borderBottom: "1px solid rgba(250, 250, 250, 0.3)",
                                                    padding: "10px",
                                                    alignItems: "center",
                                                }}
                                            >
                                                <div style={{
                                                    flex: 2,
                                                    padding: "0 10px",
                                                    overflow: "hidden",
                                                    whiteSpace: "nowrap",
                                                    textOverflow: "ellipsis",
                                                }}>
                                                    {detail.validatorAddress}
                                                </div>
                                                <div style={{
                                                    flex: 2,
                                                    padding: "0 10px",
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                }}>
                                                    <span>{detail.stakedBalanceWholeNums}</span>
                                                    <button style={{
                                                        marginLeft: "10px",
                                                        background: "linear-gradient(to right, #9797ff 6%, rgba(151, 151, 255, 0.6) 100%, #17d9d4 100%)",
                                                    }} onClick={() =>
                                                        walletStake({
                                                            validator: detail.validatorAddress,
                                                            amount: `42${yoctoZeroes}`,
                                                        })
                                                    }>Stake</button>
                                                </div>
                                                <div
                                                    style={{
                                                        display: 'flex',
                                                        flex: 2,
                                                        padding: '0 10px',
                                                        alignItems: 'center'
                                                    }}>
                                                    <div style={{
                                                        flex: 1,
                                                        overflow: "hidden",
                                                        whiteSpace: "nowrap",
                                                        textOverflow: "ellipsis",
                                                    }}>
                                                        {detail.unstakedBalanceWholeNums}
                                                    </div>
                                                    <div style={{
                                                        display: 'flex',
                                                        flexDirection: 'column',
                                                        paddingLeft: '10px',
                                                    }}>
                                                        <button
                                                            onClick={() =>
                                                                walletUnstake({
                                                                    validator: detail.validatorAddress,
                                                                    amount: detail.stakedBalance,
                                                                })
                                                            }
                                                            style={{
                                                                marginBottom: '10px',
                                                                background: "linear-gradient(to right, #9797ff 6%, rgba(151, 151, 255, 0.6) 100%, #17d9d4 100%)",
                                                            }}
                                                        >Unstake</button>
                                                        {detail.isUnstakedBalanceAvailable && (
                                                            <button style={{
                                                                background: "linear-gradient(to right, #9797ff 6%, rgba(151, 151, 255, 0.6) 100%, #17d9d4 100%)",
                                                            }}
                                                                    onClick={() => walletWithdraw({
                                                                        validator: detail.validatorAddress,
                                                                        amount: detail.unstakedBalance,
                                                                    })}
                                                            >Withdraw</button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                            {/* Begin ranged section */}
                            <div style={{
                                background: "radial-gradient(circle at top left, rgba(0, 0, 0, 0.6) 19%, rgba(0, 0, 0, 0.1) 100%)",
                                filter: "drop-shadow(3px 3px 3px rgba(255, 255, 255, 0.6)",
                                backdropFilter: "contrast(0.6)",
                                padding: "10px",
                                margin: "auto",
                                color: "#fff",
                                borderRadius: "6px",
                            }}>
                                <h3>Others</h3>
                                <div
                                    className="faux-table"
                                    style={{
                                        display: "flex",
                                        flexDirection: "column",
                                        margin: "6px 0",
                                        borderRadius: "6px",
                                        boxShadow: "0 0 1px 0 #f2f1e9",
                                    }}
                                >
                                    <div
                                        style={{
                                            display: "flex",
                                            flexDirection: "column",
                                        }}
                                    >
                                        <div
                                            className="faux-table-header"
                                            style={{
                                                display: "flex",
                                                borderRadius: "6px 6px 0 0",
                                                background: "#000",
                                                color: "#f2f1e9",
                                                textTransform: "uppercase",
                                                padding: "10px",
                                                fontSize: "1.3em",
                                            }}
                                        >
                                            <div style={{flex: 3, padding: "0 10px"}}>Validator</div>
                                        </div>
                                        <div
                                            style={{
                                                height: "6px",
                                                background: "linear-gradient(to right, #ff7966, #fff, #ff7966)",
                                                filter: "saturate(13%)",
                                            }}
                                        />
                                    </div>
                                    <div key={"not-involved"} className={"white-scrollbar"} style={{
                                        maxHeight: "50vh",
                                        overflow: "auto",
                                    }}>
                                        {rangedRows.length && rangedRows.map((detail) => {
                                            // console.log('rangedRows detail', detail)
                                                return (
                                                    <div
                                                        key={detail.validatorAddress}
                                                        className="faux-table-row"
                                                        style={{
                                                            display: "flex",
                                                            background: "#111",
                                                            color: "#fff",
                                                            borderBottom: "1px solid rgba(250, 250, 250, 0.3)",
                                                            padding: "10px",
                                                            alignItems: "center",
                                                            overflow: "hidden",
                                                        }}
                                                    >
                                                        <div style={{
                                                            flex: 3,
                                                            padding: "0 10px",
                                                            overflow: "hidden",
                                                            whiteSpace: "nowrap",
                                                            textOverflow: "ellipsis",
                                                            marginRight: "10px",
                                                        }}>
                                                            {detail.validatorAddress}
                                                        </div>
                                                        <div style={{flex: 1, padding: "0 10px"}}>
                                                            <button style={{
                                                                marginLeft: "10px",
                                                                background: "linear-gradient(to right, #9797ff 6%, rgba(151, 151, 255, 0.6) 100%, #17d9d4 100%)",
                                                            }}>Stake
                                                            </button>
                                                        </div>
                                                    </div>
                                                )
                                            }
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}

export default StakingUI
